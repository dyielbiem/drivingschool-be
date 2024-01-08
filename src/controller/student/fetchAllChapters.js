import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch the chapters of a section
---- /api/student/section/chapter/list (GET)
*/
const fetchAllChapters = async (req, res) => {
  try {
    const { sectionID } = req.query;
    if (!sectionID) throw Error("Section ID must be provided");

    const command = new QueryCommand({
      TableName: process.env.CHAPTER_TABLE,
      IndexName: "SectionIndex",
      KeyConditionExpression: "sectionID = :sectionIDValue",
      ExpressionAttributeValues: {
        ":sectionIDValue": sectionID,
      },
      ProjectionExpression: "chapterID, chapterTitle, chapterContent",
    });

    const { Items: chapters } = await dynamoClient.send(command);

    res.status(200).json({ chapters: chapters });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchAllChapters;
