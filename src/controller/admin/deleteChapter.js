import { QueryCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

const getTransactDeleteParams = (subChapters) => {
  const transactParams = {
    TransactItems: []
  };

  if (subChapters?.length === 0) return transactParams;

  transactParams.TransactItems = subChapters.map((item) => ({
    Delete: {
      TableName: process.env.SUB_CHAPTER_TABLE,
      Key: {
        subChapterID: item.subChapterID
      },
      ConditionExpression: "attribute_exists(subChapterID)"
    }
  }));

  return transactParams;
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

    const deleteChapterParams = {
      Delete: {
        TableName: process.env.CHAPTER_TABLE,
        Key: {
          chapterID
        },
        ConditionExpression: "attribute_exists(chapterID)"
      }
    };

    const transactDeleteParams = getTransactDeleteParams(subChapters);

    transactDeleteParams.TransactItems.push(deleteChapterParams);

    const command = new TransactWriteCommand(transactDeleteParams);

    await dynamoClient.send(command);

    res.status(200).json({ message: "Chapter has been deleted" });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Chapter does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default deleteChapter;
