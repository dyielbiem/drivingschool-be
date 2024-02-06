import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to add or update the content of a sub-chapter
---- /api/admin/section/chapter/subchapter/content (PATCH)
*/
const updateSubChapterContent = async (req, res) => {
  try {
    const { subChapterID, subChapterContent } = req.body;

    if (!subChapterID || !subChapterContent)
      throw Error("All required fields must filled");

    const command = new UpdateCommand({
      TableName: process.env.SUB_CHAPTER_TABLE,
      Key: {
        subChapterID
      },
      UpdateExpression: "set subChapterContent = :subChapterContentValue",
      ConditionExpression: "attribute_exists(subChapterID)",
      ExpressionAttributeValues: {
        ":subChapterContentValue": subChapterContent
      },
      ReturnValues: "ALL_NEW"
    });

    const { Attributes: updatedSubChapter } = await dynamoClient.send(command);

    res.status(200).json(updatedSubChapter);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "The sub-chapter does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updateSubChapterContent;
