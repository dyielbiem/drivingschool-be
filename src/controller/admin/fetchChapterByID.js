import { GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch a chapter of a section using ID
---- /api/admin/section/chapter (GET)
*/
const fetchChapterByID = async (req, res) => {
  try {
    const { chapterID } = req.query;

    if (!chapterID) throw Error("Chapter ID must be provided");

    const command = new GetCommand({
      TableName: process.env.CHAPTER_TABLE,
      Key: {
        chapterID
      }
    });

    const result = await dynamoClient.send(command);
    if (!result?.Item) throw Error("Chapter does not exist");

    res.status(200).json({ ...result.Item });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchChapterByID;
