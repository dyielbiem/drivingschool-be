import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to add a section of a driving school
---- /api/admin/section (POST)
*/
const addSection = async (req, res) => {
  try {
    const { drivingSchoolID, sectionTitle, adminUserName } = req.body;
    if (!sectionTitle) throw Error("Section title must be provided");

    const sectionID = ulid();

    const putSectionCmd = new PutCommand({
      TableName: process.env.SECTION_TABLE,
      Item: {
        sectionID,
        drivingSchoolID,
        sectionTitle,
        addedBy: adminUserName,
        dateAdded: Date(),
        isActive: false
      },
      ConditionExpression: "attribute_not_exists(sectionID)"
    });

    await dynamoClient.send(putSectionCmd);

    res.status(200).json({ sectionID, sectionTitle });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res
        .status(400)
        .json({ error: "An error occurred, please try again" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default addSection;
