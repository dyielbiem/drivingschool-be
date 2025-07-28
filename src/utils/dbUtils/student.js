import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";

const TableName = process.env.STUDENT_TABLE;

export const getStudent = async (drivingSchoolID, studentUserName) => {
  const command = new GetCommand({
    TableName,
    Key: {
      drivingSchoolID,
      studentUserName
    }
  });

  const result = await dynamoClient.send(command);
  return result;
};

export const getAffiliationStudentList = async (affiliationID) => {
  const command = new QueryCommand({
    TableName,
    IndexName: "AffiliationIDIndex",
    KeyConditionExpression: "affiliationID = :affiliationID",
    ExpressionAttributeValues: {
      ":affiliationID": affiliationID
    }
  });

  const { Items = [] } = await dynamoClient.send(command);
  return Items;
};
