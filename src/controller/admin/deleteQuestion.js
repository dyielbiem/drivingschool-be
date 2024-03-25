import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to delete a section or chapter question
---- /api/admin/question (DELETE)
*/
const deleteQuestion = async (req, res) => {
  try {
    const { questionID } = req.query;

    if (!questionID) throw Error("Question ID must be filled");

    const deleteCommand = new DeleteCommand({
      TableName: process.env.QUESTION_TABLE,
      Key: {
        questionID
      },
      ConditionExpression: "attribute_exists(questionID)",
      ReturnValues: "ALL_OLD"
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

export default deleteQuestion;
