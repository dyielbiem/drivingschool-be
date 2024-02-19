import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to delete a sub-chapter of a chapter
---- /api/admin/section/chapter/subchapter (DELETE)
*/
const deleteSubChapter = async (req, res) => {
  try {
    const { subChapterID } = req.query;

    if (!subChapterID) throw Error("Sub-chapter ID must be filled");

    const command = new DeleteCommand({
      TableName: process.env.SUB_CHAPTER_TABLE,
      Key: {
        subChapterID
      },
      ConditionExpression: "attribute_exists(subChapterID)",
      ReturnValues: "ALL_OLD"
    });

    const response = await dynamoClient.send(command);

    res.status(200).json(response);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Sub-chapter does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default deleteSubChapter;
