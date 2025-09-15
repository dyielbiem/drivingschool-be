import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";

const TableName = process.env.SECTION_TABLE;

export const getSection = async (sectionID) => {
  const command = new GetCommand({
    TableName,
    Key: {
      sectionID
    }
  });

  const results = await dynamoClient.send(command);
  return results;
};

export const getActiveSection = async (drivingSchoolID) => {
  const command = new QueryCommand({
    TableName,
    IndexName: "DrivingSchoolIndex",
    KeyConditionExpression: "drivingSchoolID = :drivingSchoolIDValue",
    FilterExpression: "isActive  = :isActiveValue",
    ExpressionAttributeValues: {
      ":drivingSchoolIDValue": drivingSchoolID,
      ":isActiveValue": true
    },
    ProjectionExpression: "sectionID"
  });

  const { Items: sections } = await dynamoClient.send(command);

  return sections?.[0] || null;
};
