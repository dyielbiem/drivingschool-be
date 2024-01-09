import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to add a test question for a chapter
---- /api/admin/section/chapter/question (POST)
*/
const addChapterQuestion = async (req, res) => {
  try {
    const {
      drivingSchoolID,
      adminUserName,
      chapterID,
      question,
      choices,
      correctAnswer
    } = req.body;

    if (!chapterID || !question || !choices || !correctAnswer)
      throw Error("All required fields must be filled");

    const questionID = ulid();

    const command = new PutCommand({
      TableName: process.env.QUESTION_TABLE,
      Item: {
        questionID,
        chapterID,
        question,
        choices,
        correctAnswer,
        drivingSchoolID,
        addedBy: adminUserName,
        dateAdded: Date()
      },
      ConditionExpression: "attribute_not_exists(questionID)"
    });

    await dynamoClient.send(command);

    res
      .status(200)
      .json({ chapterID, questionID, question, choices, correctAnswer });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res
        .status(400)
        .json({ error: "An error occurred, please try again" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default addChapterQuestion;
