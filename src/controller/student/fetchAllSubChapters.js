import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch the sub-chapters of a chapter
---- /api/student/section/chapter/subchapter/list (GET)
*/
const fetchAllSubChapters = async (req, res) => {
  try {
    const { chapterID } = req.query;
    if (!chapterID) throw Error("Chapter ID must be provided");

    const command = new QueryCommand({
      TableName: process.env.SUB_CHAPTER_TABLE,
      IndexName: "ChapterIndex",
      KeyConditionExpression: "chapterID = :chapterIDValue",
      ExpressionAttributeValues: {
        ":chapterIDValue": chapterID
      },
      ProjectionExpression: "subChapterID, subChapterTitle, subChapterContent"
    });

    const { Items: subChapters } = await dynamoClient.send(command);

    if (subChapters.length === 0)
      return res.status(200).json({ subChapters: [] });

    const sortedSubChapters = subChapters.sort((a, b) =>
      a.subChapterID.localeCompare(b.subChapterID)
    );

    res.status(200).json({ subChapters: sortedSubChapters });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchAllSubChapters;
