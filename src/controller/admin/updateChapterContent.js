import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to add a chapter to a section
---- /api/admin/section/chapter/content (PATCH)
*/
const updateChapterContent = async (req, res) => {
  try {
    const { chapterID, chapterContent } = req.body;

    if (!chapterID || !chapterContent)
      throw Error("All required fields must filled");

    const command = new UpdateCommand({
      TableName: process.env.CHAPTER_TABLE,
      Key: {
        chapterID
      },
      UpdateExpression: "set chapterContent = :chapterContentValue",
      ConditionExpression: "attribute_exists(chapterID)",
      ExpressionAttributeValues: {
        ":chapterContentValue": chapterContent
      },
      ReturnValues: "ALL_NEW"
    });

    const { Attributes: updatedChapter } = await dynamoClient.send(command);

    res.status(200).json(updatedChapter);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "The chapter does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updateChapterContent;
