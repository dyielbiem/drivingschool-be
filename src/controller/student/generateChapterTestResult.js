import {
  QueryCommand,
  PutCommand,
  UpdateCommand,
  GetCommand
} from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import dynamoClient from "../../db_connection/dbCLient.js";

const updateCompletedChapters = (completedChapters, newChapter) => {
  if (!Array.isArray(completedChapters)) return [newChapter];

  const isNewChapterAlreadyCompleted = completedChapters.includes(newChapter);
  if (isNewChapterAlreadyCompleted) return completedChapters;

  const updatedCompletedChapters = [...completedChapters, newChapter];

  return updatedCompletedChapters;
};

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
    if (answers.length === 0) throw Error("Answers must not be an empty array");

    // Check if chapter exists
    const getChapterCmd = new GetCommand({
      TableName: process.env.CHAPTER_TABLE,
      Key: {
        chapterID
      }
    });

    const { Item: chapter } = await dynamoClient.send(getChapterCmd);
    if (!chapter) throw Error("Chapter does not exist");

    // Get the test questions from the database
    const queryQuestionsCmd = new QueryCommand({
      TableName: process.env.QUESTION_TABLE,
      IndexName: "ChapterIndex",
      KeyConditionExpression: "chapterID = :chapterIDValue",
      ExpressionAttributeValues: {
        ":chapterIDValue": chapterID
      },
      ProjectionExpression: "questionID, correctAnswer"
    });

    const { Items: test } = await dynamoClient.send(queryQuestionsCmd);
    if (test.length === 0) throw Error("Chapter has no test");

    // Check if the length of provided answers is valid
    const invalidAnswersLength = {
      conditionOne:
        (!chapter.noOfQuestionsToShow ||
          chapter.noOfQuestionsToShow > test.length) &&
        answers.length !== test.length,
      conditionTwo:
        chapter.noOfQuestionsToShow &&
        chapter.noOfQuestionsToShow <= test.length &&
        chapter.noOfQuestionsToShow !== answers.length
    };

    if (invalidAnswersLength.conditionOne || invalidAnswersLength.conditionTwo)
      throw Error(
        "The provided answers does not match the length of the chapter questions"
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

    // Insert the test result into database
    const resultID = ulid();
    const putResultCommand = new PutCommand({
      TableName: process.env.RESULT_TABLE,
      Item: {
        resultID,
        drivingSchoolID,
        studentUserName,
        chapterID,
        score: noOfCorrectAnswers,
        numberOfQuestions: answers.length,
        answers,
        scorePercentage: scorePercentage * 100,
        isPassed: scorePercentage >= 0.75,
        dateAnswered: Date()
      },
      ConditionExpression: "attribute_not_exists(resultID)"
    });

    await dynamoClient.send(putResultCommand);

    const { completedChapters } = student;

    // Generate the updated completed chapters of the student
    const updatedCompletedChapters = updateCompletedChapters(
      completedChapters,
      chapterID
    );

    if (
      updatedCompletedChapters.length === completedChapters?.length ||
      scorePercentage < 0.75
    )
      return res.status(200).json({
        resultID,
        chapterID,
        numberOfQuestions: answers.length,
        score: noOfCorrectAnswers,
        scorePercentage: scorePercentage * 100,
        isPassed: scorePercentage >= 0.75
      });

    // Update the completed chapters of the student
    const updatedCompletedChaptersCmd = new UpdateCommand({
      TableName: process.env.STUDENT_TABLE,
      Key: {
        drivingSchoolID,
        studentUserName
      },
      UpdateExpression: "SET completedChapters = :completedChapters",
      ExpressionAttributeValues: {
        ":completedChapters": updatedCompletedChapters
      },
      ConditionExpression:
        "attribute_exists(drivingSchoolID) AND attribute_exists(studentUserName)"
    });

    await dynamoClient.send(updatedCompletedChaptersCmd);

    res.status(200).json({
      resultID,
      chapterID,
      numberOfQuestions: answers.length,
      score: noOfCorrectAnswers,
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
