import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to update the title of a chapter
---- /api/admin/section/chapter/title (PATCH)
*/
const updateChapterTitle = async (req, res) => {
  try {
    const { chapterID, chapterTitle } = req.body;

    if (!chapterID || !chapterTitle)
      throw Error("All required fields must filled");

    const command = new UpdateCommand({
      TableName: process.env.CHAPTER_TABLE,
      Key: {
        chapterID
      },
      UpdateExpression: "SET chapterTitle = :chapterTitleValue",
      ConditionExpression: "attribute_exists(chapterID)",
      ExpressionAttributeValues: {
        ":chapterTitleValue": chapterTitle
      },
      ReturnValues: "ALL_NEW"
    });

    const { Attributes: updatedChapter } = await dynamoClient.send(command);

    res.status(200).json(updatedChapter);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Chapter does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updateChapterTitle;
