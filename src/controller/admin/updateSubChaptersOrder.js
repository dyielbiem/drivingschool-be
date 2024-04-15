import { TransactWriteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch all the sub-chapters of a chapter
---- /api/admin/section/chapter/subchapter/list/order (PATCH)
*/
const updateSubChaptersOrder = async (req, res) => {
  try {
    const { subChapters, chapterID } = req.body;

    if (!chapterID) throw Error("Chapter ID must be provided");
    if (!subChapters) throw Error("Sub-chapters must be provided");
    if (!Array.isArray(subChapters))
      throw Error("Sub-chapters must be an array");
    if (subChapters.length === 0) throw Error("Sub-chapters must not be empty");

    const querySubChaptersCommand = new QueryCommand({
      TableName: process.env.SUB_CHAPTER_TABLE,
      IndexName: "ChapterIndex",
      KeyConditionExpression: "chapterID = :chapterIDValue",
      ExpressionAttributeValues: {
        ":chapterIDValue": chapterID
      }
    });

    const { Items: oldSubChapters } = await dynamoClient.send(
      querySubChaptersCommand
    );

    if (oldSubChapters.length > subChapters.length)
      throw Error("All sub-chapters of the chapter must be provided");
    if (oldSubChapters.length < subChapters.length)
      throw Error("Provide only the sub-chapters that belong to the chapter");

    const transactUpdateCommand = new TransactWriteCommand({
      TransactItems: subChapters.map((subChapter, index) => ({
        Update: {
          TableName: process.env.SUB_CHAPTER_TABLE,
          Key: {
            subChapterID: subChapter.subChapterID
          },
          UpdateExpression: "SET orderID = :orderIDValue",
          ExpressionAttributeValues: {
            ":orderIDValue": index
          },
          ConditionExpression: "attribute_exists(subChapterID)",
          ReturnValues: "ALL_NEW"
        }
      }))
    });

    await dynamoClient.send(transactUpdateCommand);

    subChapters.forEach((subChapter, index) => {
      Object.assign(subChapter, { ...subChapter, orderID: index });
      return subChapter;
    });

    res
      .status(200)
      .json({ subChapters: [...subChapters].sort((a, b) => a - b) });
  } catch (error) {
    if (error.message && error.message.includes("Transaction cancelled"))
      return res
        .status(400)
        .json({ error: "All sub-chapters of the chapter must be provided" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updateSubChaptersOrder;
