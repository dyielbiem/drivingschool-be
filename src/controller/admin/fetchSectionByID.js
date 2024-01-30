import { GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch a section of a driving school using ID
---- /api/admin/section (GET)
*/
const fetchSectionByID = async (req, res) => {
  try {
    const { sectionID } = req.query;

    if (!sectionID) throw Error("Section ID must be provided");

    const command = new GetCommand({
      TableName: process.env.SECTION_TABLE,
      Key: {
        sectionID
      }
    });

    const result = await dynamoClient.send(command);
    if (!result?.Item) throw Error("Section does not exist");

    res.status(200).json({ ...result.Item });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchSectionByID;
