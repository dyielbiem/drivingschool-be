import { TransactWriteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to activate a section of a driving school
---- /api/admin/section/activate (PATCH)
*/
const activateSection = async (req, res) => {
  try {
    const { sectionID, drivingSchoolID } = req.body;
    if (!sectionID) throw Error("Section ID must be provided");

    const getActiveSectionCmd = new QueryCommand({
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

    const { Items: activeSections } =
      await dynamoClient.send(getActiveSectionCmd);

    const transactParams = {
      TransactItems: []
    };

    if (activeSections.length !== 0) {
      transactParams.TransactItems = activeSections.map((section) => ({
        Update: {
          TableName: process.env.SECTION_TABLE,
          Key: {
            sectionID: section.sectionID
          },
          UpdateExpression: "SET isActive = :isActiveValue",
          ExpressionAttributeValues: {
            ":isActiveValue": false
          },
          ConditionExpression: "attribute_exists(sectionID)"
        }
      }));
    }

    transactParams.TransactItems.push({
      Update: {
        TableName: process.env.SECTION_TABLE,
        Key: {
          sectionID: sectionID
        },
        UpdateExpression: "SET isActive = :isActiveValue",
        ExpressionAttributeValues: {
          ":isActiveValue": true
        },
        ConditionExpression: "attribute_exists(sectionID)"
      }
    });

    const transactCmd = new TransactWriteCommand(transactParams);

    await dynamoClient.send(transactCmd);

    res.status(200).json({ message: "Section has been activated" });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res
        .status(400)
        .json({ error: "An error occurred, please try again" });
    if (
      error.message ===
      "Transaction request cannot include multiple operations on one item"
    )
      return res.status(400).json({ error: "Section is currently active" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default activateSection;
