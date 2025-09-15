import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";

const TableName = process.env.COURSE_TABLE;

export const getCourse = async (courseID) => {
  const command = new GetCommand({
    TableName,
    Key: {
      courseID: courseID
    }
  });

  const result = await dynamoClient.send(command);
  return result;
};

export const updateCourseItem = async (courseID, attribute) => {
  const UpdateExpression = `SET ${Object.keys(attribute)
    .map((key) => `${key.slice(1)} = ${key}`)
    .join(",")}`;

  const command = new UpdateCommand({
    TableName,
    Key: {
      courseID
    },
    UpdateExpression,
    ConditionExpression: "attribute_exists(courseID)",
    ExpressionAttributeValues: attribute,
    ReturnValues: "ALL_NEW"
  });

  const { Attributes = {} } = await dynamoClient.send(command);
  return Attributes;
};
