import { QueryCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";

export const getActiveSection = async (drivingSchoolID) => {
  const sectionCommand = new QueryCommand({
    TableName: process.env.SECTION_TABLE,
    IndexName: "DrivingSchoolIndex",
    KeyConditionExpression: "drivingSchoolID = :drivingSchoolIDValue",
    FilterExpression: "isActive  = :isActiveValue",
    ExpressionAttributeValues: {
      ":drivingSchoolIDValue": drivingSchoolID,
      ":isActiveValue": true
    },
    ProjectionExpression: "sectionID"
  });

  const { Items: sections } = await dynamoClient.send(sectionCommand);

  return sections[0] || null;
};
