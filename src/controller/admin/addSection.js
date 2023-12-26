import { PutCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";
import { ulid } from "ulid";

/*
---- Controller to add a section of a driving school
---- /api/admin/section (POST)
*/
const addSection = async (req, res) => {
  try {
    const { drivingSchoolID, sectionTitle, adminUserName } = req.body;
    if (!sectionTitle) throw Error("Section title must be provided");

    const sectionID = ulid();

    const command = new PutCommand({
      TableName: process.env.SECTION_TABLE,
      Item: {
        sectionID,
        drivingSchoolID,
        sectionTitle,
        addedBy: adminUserName,
        dateAdded: Date(),
      },
      ConditionExpression: "attribute_not_exists(sectionID)",
    });

    await dynamoClient.send(command);

    res.status(400).json({ sectionID, sectionTitle });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default addSection;
