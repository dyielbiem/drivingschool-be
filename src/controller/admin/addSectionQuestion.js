import { PutCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";
import { ulid } from "ulid";

/*
---- Controller to add a test question for a section
---- /api/admin/section/question (POST)
*/
const addSectionQuestion = async (req, res) => {
  try {
    const {
      drivingSchoolID,
      adminUserName,
      sectionID,
      question,
      choices,
      correctAnswer,
    } = req.body;

    if (!sectionID || !question || !choices || !correctAnswer)
      throw Error("All required fields must be filled");

    const questionID = ulid();

    const command = new PutCommand({
      TableName: process.env.QUESTION_TABLE,
      Item: {
        questionID,
        sectionID,
        question,
        choices,
        correctAnswer,
        drivingSchoolID,
        addedBy: adminUserName,
        dateAdded: Date(),
      },
      ConditionExpression: "attribute_not_exists(questionID)",
    });

    await dynamoClient.send(command);

    res
      .status(200)
      .json({ sectionID, questionID, question, choices, correctAnswer });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res
        .status(400)
        .json({ error: "An error occurred, please try again" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default addSectionQuestion;
