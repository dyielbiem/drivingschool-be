import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch all the chapters of a section
---- /api/admin/section/chapter/list (GET)
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
        ":sectionIDValue": sectionID
      },
      ProjectionExpression: "chapterID, chapterTitle, chapterContent"
    });

    const result = await dynamoClient.send(command);
    if (result.Items.length === 0)
      return res.status(200).json({ chapters: [] });

    const sortedChapters = result.Items.sort((a, b) =>
      a.chapterID.localeCompare(b.chapterID)
    );

    res.status(200).json({ chapters: sortedChapters });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchAllChapters;
