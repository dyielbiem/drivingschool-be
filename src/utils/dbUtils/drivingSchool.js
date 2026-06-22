import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";

const TableName = process.env.DRIVING_SCHOOL_TABLE;

export const getDrivingSchool = async (drivingSchoolID, otherArgs = {}) => {
  const command = new GetCommand({
    TableName,
    Key: {
      drivingSchoolID
    },
    ...otherArgs
  });

  const result = await dynamoClient.send(command);
  return result;
};

export const updateDrivingSchoolItem = async (drivingSchoolID, attribute) => {
  const UpdateExpression = `SET ${Object.keys(attribute)
    .map((key) => `${key.slice(1)} = ${key}`)
    .join(",")}`;

  const command = new UpdateCommand({
    TableName,
    Key: {
      drivingSchoolID
    },
    UpdateExpression,
    ConditionExpression: "attribute_exists(drivingSchoolID)",
    ExpressionAttributeValues: attribute,
    ReturnValues: "ALL_NEW"
  });

  const { Attributes = {} } = await dynamoClient.send(command);
  return Attributes;
};
