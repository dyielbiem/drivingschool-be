import { QueryCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
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

    const getActiveSectionCommand = new QueryCommand({
      TableName: process.env.SECTION_TABLE,
      IndexName: "DrivingSchoolIndex",
      KeyConditionExpression: "drivingSchoolID = :drivingSchoolIDValue",
      FilterExpression: "isActive = :isActiveValue",
      ExpressionAttributeValues: {
        ":isActiveValue": true,
        ":drivingSchoolIDValue": drivingSchoolID
      },
      ProjectionExpression: "sectionID, isActive"
    });

    const { Items: activeSection } = await dynamoClient.send(
      getActiveSectionCommand
    );

    const transactParams = { TransactItems: [] };

    if (activeSection.length !== 0) {
      transactParams.TransactItems.push({
        Update: {
          TableName: process.env.SECTION_TABLE,
          Key: {
            sectionID: activeSection[0].sectionID
          },
          UpdateExpression: "SET isActive = :isActiveValue",
          ExpressionAttributeValues: {
            ":isActiveValue": false
          }
        }
      });
    }

    const sectionID = ulid();

    transactParams.TransactItems.push({
      Put: {
        TableName: process.env.SECTION_TABLE,
        Item: {
          sectionID,
          drivingSchoolID,
          sectionTitle,
          addedBy: adminUserName,
          dateAdded: Date(),
          isActive: true
        },
        ConditionExpression: "attribute_not_exists(sectionID)"
      }
    });

    const transactCommand = new TransactWriteCommand(transactParams);
    await dynamoClient.send(transactCommand);

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
