import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import dynamoClient from "../../db_connection/dbCLient.js";
import generateTestScore from "../../utils/generateTestScore.js";

/*
---- Controller to generate the section test result
---- /api/student/section/test/result (POST)
*/
const generateSectionTestResult = async (req, res) => {
  try {
    const { sectionID, answers, studentUserName, drivingSchoolID } = req.body;
    if (!answers) throw Error("All required fields must be filled");
    if (typeof answers === "string")
      throw Error("The field 'answers' must be an array, not a string");

    // Get the test questions from the database
    const getCorrectAnswerCommand = new QueryCommand({
      TableName: process.env.QUESTION_TABLE,
      IndexName: "SectionIndex",
      KeyConditionExpression: "sectionID = :sectionIDValue",
      ExpressionAttributeValues: {
        ":sectionIDValue": sectionID
      },
      ProjectionExpression: "questionID, correctAnswer"
    });

    const { Items: test } = await dynamoClient.send(getCorrectAnswerCommand);
    if (test.length === 0) throw Error("Section test does not exist");
    if (test.length !== answers.length)
      throw Error("The number of answers do not match the number of questions");

    const sortedTest = test.sort((a, b) =>
      a.questionID.localeCompare(b.questionID)
    );

    const numberOfCorrects = generateTestScore(sortedTest, answers);
    const scorePercentage = numberOfCorrects / test.length;

    const resultID = ulid();
    const putResultCommand = new PutCommand({
      TableName: process.env.RESULT_TABLE,
      Item: {
        resultID,
        drivingSchoolID,
        studentUserName,
        sectionID,
        score: numberOfCorrects,
        numberOfQuestions: test.length,
        answers,
        scorePercentage: scorePercentage * 100,
        isPassed: scorePercentage >= 0.75
      },
      ConditionExpression: "attribute_not_exists(resultID)"
    });

    await dynamoClient.send(putResultCommand);

    res.status(200).json({
      resultID,
      sectionID,
      numberOfQuestions: test.length,
      score: numberOfCorrects,
      scorePercentage: scorePercentage * 100,
      isPassed: scorePercentage >= 0.75
    });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res
        .status(400)
        .json({ error: "An error occurred, please try again" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json({ error });
  }
};

export default generateSectionTestResult;
