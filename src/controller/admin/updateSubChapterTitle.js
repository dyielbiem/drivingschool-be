import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to add or update the title of a sub-chapter
---- /api/admin/section/chapter/subchapter/title (PATCH)
*/
const updateSubChapterTitle = async (req, res) => {
  try {
    const { subChapterID, subChapterTitle } = req.body;

    if (!subChapterID || !subChapterTitle)
      throw Error("All required fields must filled");

    const command = new UpdateCommand({
      TableName: process.env.SUB_CHAPTER_TABLE,
      Key: {
        subChapterID
      },
      UpdateExpression: "SET subChapterTitle = :subChapterTitleValue",
      ConditionExpression: "attribute_exists(subChapterID)",
      ExpressionAttributeValues: {
        ":subChapterTitleValue": subChapterTitle
      },
      ReturnValues: "ALL_NEW"
    });

    const { Attributes: updatedSubChapter } = await dynamoClient.send(command);

    res.status(200).json(updatedSubChapter);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Sub-chapter does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updateSubChapterTitle;
