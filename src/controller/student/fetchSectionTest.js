import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch the test of a section
---- /api/student/section/test (GET)
*/
const fetchSectionTest = async (req, res) => {
  try {
    const sectionID = req.query.sectionID;
    if (!sectionID) throw Error("Section ID must be provided");

    const command = new QueryCommand({
      TableName: process.env.QUESTION_TABLE,
      IndexName: "SectionIndex",
      KeyConditionExpression: "sectionID = :sectionIDValue",
      ExpressionAttributeValues: {
        ":sectionIDValue": sectionID,
      },
      ProjectionExpression: "questionID, question, choices",
    });

    const result = await dynamoClient.send(command);
    if (result.Items.length === 0) return res.status(200).json({ test: [] });

    const test = result.Items.sort((a, b) =>
      a.questionID.localeCompare(b.questionID)
    );

    res.status(200).json({ test });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchSectionTest;
