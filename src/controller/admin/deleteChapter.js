import {
  DeleteCommand,
  QueryCommand,
  BatchWriteCommand
} from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

const deleteSubChapter = async (subChapters) => {
  if (subChapters?.length === 0) return;
  const command = new BatchWriteCommand({
    RequestItems: {
      [process.env.SUB_CHAPTER_TABLE]: subChapters.map((subChapter) => ({
        DeleteRequest: {
          Key: {
            subChapterID: subChapter.subChapterID
          }
        }
      }))
    }
  });

  await dynamoClient.send(command);
};

/*
---- Controller to delete a chapter of a section
---- /api/admin/section/chapter (DELETE)
*/
const deleteChapter = async (req, res) => {
  try {
    const { chapterID } = req.query;

    if (!chapterID) throw Error("Chapter ID must be filled");

    const queryCommand = new QueryCommand({
      TableName: process.env.SUB_CHAPTER_TABLE,
      IndexName: "ChapterIndex",
      KeyConditionExpression: "chapterID = :chapterIDValue",
      ExpressionAttributeValues: {
        ":chapterIDValue": chapterID
      }
    });

    const { Items: subChapters } = await dynamoClient.send(queryCommand);
    await deleteSubChapter(subChapters);

    const deleteCommand = new DeleteCommand({
      TableName: process.env.CHAPTER_TABLE,
      Key: {
        chapterID
      },
      ConditionExpression: "attribute_exists(chapterID)",
      ReturnValues: "ALL_OLD"
    });

    const deleteResponse = await dynamoClient.send(deleteCommand);

    res.status(200).json(deleteResponse);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Chapter does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default deleteChapter;
