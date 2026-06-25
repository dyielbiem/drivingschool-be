import { GetCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";

const TableName = process.env.SECTION_TABLE;

export const getAllSection = async (otherArgs = {}) => {
  const command = new ScanCommand({
    TableName,
    ...otherArgs
  });

  const result = await dynamoClient.send(command);
  return result;
};

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

export const getDrivingSchoolSectionList = async (
  drivingSchoolID,
  otherArgs = {}
) => {
  const sectionCommand = new QueryCommand({
    TableName: process.env.SECTION_TABLE,
    IndexName: "DrivingSchoolIndex",
    KeyConditionExpression: "drivingSchoolID = :drivingSchoolIDValue",
    ExpressionAttributeValues: {
      ":drivingSchoolIDValue": drivingSchoolID
    },
    ...otherArgs
  });

  const results = await dynamoClient.send(sectionCommand);
  return results;
};
