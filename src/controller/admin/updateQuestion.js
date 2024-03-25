import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to edit a section or chapter question
---- /api/admin/question (PATCH)
*/
const updateQuestion = async (req, res) => {
  try {
    const { questionID, question, correctAnswer, otherChoices } = req.body;

    if (!questionID || !question || !correctAnswer || !otherChoices)
      throw Error("All required field must be filled");

    if (!Array.isArray(otherChoices))
      throw Error("Other choices must be a array");

    if (otherChoices.length === 0)
      throw Error("Other choices must be provided");

    if (otherChoices.includes(correctAnswer))
      throw Error("Correct answer must not be listed in other choices");

    const deleteCommand = new UpdateCommand({
      TableName: process.env.QUESTION_TABLE,
      Key: {
        questionID
      },
      UpdateExpression:
        "SET question = :questionValue, correctAnswer = :correctAnswerValue, otherChoices = :otherChoicesValue  ",
      ExpressionAttributeValues: {
        ":questionValue": question,
        ":correctAnswerValue": correctAnswer,
        ":otherChoicesValue": otherChoices
      },
      ConditionExpression: "attribute_exists(questionID)"
    });

    const deleteResponse = await dynamoClient.send(deleteCommand);

    res.status(200).json(deleteResponse);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Question does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updateQuestion;
