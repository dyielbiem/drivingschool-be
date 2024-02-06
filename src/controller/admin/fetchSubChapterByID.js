import { GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch a sub-chapter of a chapter using ID
---- /api/admin/section/chapter/subchapter (GET)
*/
const fetchSubChapterByID = async (req, res) => {
  try {
    const { subChapterID } = req.query;

    if (!subChapterID) throw Error("Sub-chapter ID must be provided");

    const command = new GetCommand({
      TableName: process.env.SUB_CHAPTER_TABLE,
      Key: {
        subChapterID
      }
    });

    const result = await dynamoClient.send(command);
    if (!result?.Item) throw Error("Sub-chapter does not exist");

    res.status(200).json({ ...result.Item });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchSubChapterByID;
