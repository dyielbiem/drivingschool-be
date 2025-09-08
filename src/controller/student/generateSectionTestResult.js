import { QueryCommand, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";

import dynamoClient from "../../db_connection/dbCLient.js";
import { updateStudentItem } from "../../utils/dbUtils/student.js";

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
    if (answers.length === 0) throw Error("Answers must not be an empty array");

    // Check if section exists
    const getSectionCmd = new GetCommand({
      TableName: process.env.SECTION_TABLE,
      Key: {
        sectionID
      }
    });

    const { Item: section } = await dynamoClient.send(getSectionCmd);
    if (!section) throw Error("Section does not exist");

    // Get the test questions from the database
    const queryQuestionsCmd = new QueryCommand({
      TableName: process.env.QUESTION_TABLE,
      IndexName: "SectionIndex",
      KeyConditionExpression: "sectionID = :sectionIDValue",
      ExpressionAttributeValues: {
        ":sectionIDValue": sectionID
      },
      ProjectionExpression: "questionID, correctAnswer"
    });

    const { Items: test } = await dynamoClient.send(queryQuestionsCmd);
    if (test.length === 0) throw Error("Section has no test");

    // Check if the length of provided answers is valid
    const invalidAnswersLength = {
      conditionOne:
        (!section.noOfQuestionsToShow ||
          section.noOfQuestionsToShow > test.length) &&
        answers.length !== test.length,
      conditionTwo:
        section.noOfQuestionsToShow &&
        section.noOfQuestionsToShow <= test.length &&
        section.noOfQuestionsToShow !== answers.length
    };

    if (invalidAnswersLength.conditionOne || invalidAnswersLength.conditionTwo)
      throw Error(
        "The provided answers does not match the length of the section questions"
      );

    // Check if student exists
    const getStudentCommand = new GetCommand({
      TableName: process.env.STUDENT_TABLE,
      Key: {
        drivingSchoolID,
        studentUserName
      }
    });

    const { Item: student } = await dynamoClient.send(getStudentCommand);
    if (!student) throw Error("Student does not exist");

    // Calculate the correct answer of the student
    let noOfCorrectAnswers = 0;
    answers.forEach((answer) => {
      if (!answer.questionID)
        throw Error("The answer is present, but the Question ID is missing");

      if (!answer.answer)
        throw Error("The Question ID is present, but the answer is missing");

      const question = test.find(
        (item) => item.questionID === answer.questionID
      );

      if (!question)
        throw Error(
          "One of the answers does not have a corresponding question"
        );

      if (answer.answer === question.correctAnswer) noOfCorrectAnswers += 1;
    });

    const scorePercentage = noOfCorrectAnswers / answers.length;

    const resultID = ulid();
    const isPassed = scorePercentage >= 0.75;
    const putResultCommand = new PutCommand({
      TableName: process.env.RESULT_TABLE,
      Item: {
        resultID,
        drivingSchoolID,
        studentUserName,
        sectionID,
        score: noOfCorrectAnswers,
        numberOfQuestions: answers.length,
        answers,
        scorePercentage: scorePercentage * 100,
        isPassed,
        dateAnswered: Date()
      },
      ConditionExpression: "attribute_not_exists(resultID)"
    });

    await dynamoClient.send(putResultCommand);

    if (isPassed) {
      await updateStudentItem(drivingSchoolID, studentUserName, {
        ":completionDate": Date(),
        ":isCourseCompleted": true
      });
    }

    res.status(200).json({
      resultID,
      sectionID,
      numberOfQuestions: answers.length,
      score: noOfCorrectAnswers,
      scorePercentage: scorePercentage * 100,
      isPassed
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
