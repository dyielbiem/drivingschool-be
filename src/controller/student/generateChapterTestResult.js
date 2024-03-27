import { QueryCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import dynamoClient from "../../db_connection/dbCLient.js";
import generateTestScore from "../../utils/generateTestScore.js";

/*
---- Controller to generate the chapter test result
---- /api/student/section/chapter/test/result (POST)
*/
const generateChapterTestResult = async (req, res) => {
  try {
    const { chapterID, answers, studentUserName, drivingSchoolID } = req.body;
    if (!chapterID || !answers)
      throw Error("All required fields must be filled");
    if (typeof answers === "string")
      throw Error("The field 'answers' must be an array, not a string");

    // Get the test questions from the database
    const getCorrectAnswerCommand = new QueryCommand({
      TableName: process.env.QUESTION_TABLE,
      IndexName: "ChapterIndex",
      KeyConditionExpression: "chapterID = :chapterIDValue",
      ExpressionAttributeValues: {
        ":chapterIDValue": chapterID
      },
      ProjectionExpression: "questionID, correctAnswer"
    });

    const { Items: test } = await dynamoClient.send(getCorrectAnswerCommand);
    if (test.length === 0) throw Error("Chapter test does not exist");
    if (test.length !== answers.length)
      throw Error("The number of answers do not match the number of questions");

    const sortedTest = test.sort((a, b) =>
      a.questionID.localeCompare(b.questionID)
    );

    // Check if the student already passed the test
    // If yes, do not allow the student to retake the exam
    const isPassedCommand = new QueryCommand({
      TableName: process.env.RESULT_TABLE,
      IndexName: "ChapterIndex",
      KeyConditionExpression: "chapterID = :chapterIDValue",
      FilterExpression:
        "studentUserName = :studentUserNameValue AND drivingSchoolID = :drivingSchoolIDValue AND isPassed = :isPassedValue",
      ExpressionAttributeValues: {
        ":chapterIDValue": chapterID,
        ":drivingSchoolIDValue": drivingSchoolID,
        ":studentUserNameValue": studentUserName,
        ":isPassedValue": true
      }
    });

    const { Items: passedResult } = await dynamoClient.send(isPassedCommand);
    if (passedResult.length > 0)
      throw Error("The test has already been passed by the student");

    // Insert the test result into database
    const numberOfCorrects = generateTestScore(sortedTest, answers);
    const scorePercentage = numberOfCorrects / test.length;

    const resultID = ulid();
    const putResultCommand = new PutCommand({
      TableName: process.env.RESULT_TABLE,
      Item: {
        resultID,
        drivingSchoolID,
        studentUserName,
        chapterID,
        score: numberOfCorrects,
        numberOfQuestions: test.length,
        answers,
        scorePercentage: scorePercentage * 100,
        isPassed: scorePercentage >= 0.75
      },
      ConditionExpression: "attribute_not_exists(resultID)"
    });

    await dynamoClient.send(putResultCommand);

    // Update the progress of the student
    const studentProgressCommand = new UpdateCommand({
      TableName: process.env.STUDENT_TABLE,
      Key: {
        drivingSchoolID,
        studentUserName
      },
      UpdateExpression: "SET progressID = :progressIDValue",
      ExpressionAttributeValues: {
        ":progressIDValue": chapterID
      },
      ConditionExpression:
        "attribute_exists(drivingSchoolID) AND attribute_exists(studentUserName)"
    });

    await dynamoClient.send(studentProgressCommand);

    res.status(200).json({
      resultID,
      chapterID,
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

export default generateChapterTestResult;
