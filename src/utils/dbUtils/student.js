import { GetCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

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

export const updateStudentItem = async (
  drivingSchoolID,
  studentUserName,
  attribute
) => {
  const UpdateExpression = `SET ${Object.keys(attribute)
    .map((key) => `${key.slice(1)} = ${key}`)
    .join(",")}`;

  const command = new UpdateCommand({
    TableName,
    Key: {
      drivingSchoolID,
      studentUserName
    },
    UpdateExpression,
    ConditionExpression:
      "attribute_exists(drivingSchoolID) AND attribute_exists(studentUserName)",
    ExpressionAttributeValues: attribute,
    ReturnValues: "ALL_NEW"
  });

  const { Attributes = {} } = await dynamoClient.send(command);
  return Attributes;
};

export const getAllStudentsInSection = async (drivingSchoolID, sectionID) => {
  const items = [];
  let lastEvaluatedKey = null;

  do {
    const params = {
      TableName,
      IndexName: "DrivingSchoolIndex",
      KeyConditionExpression: "drivingSchoolID = :drivingSchoolID",
      FilterExpression: "sectionID = :sectionID",
      ExpressionAttributeValues: {
        ":drivingSchoolID": drivingSchoolID,
        ":sectionID": sectionID
      },
      Limit: 100
    };

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }

    const command = new QueryCommand(params);

    // eslint-disable-next-line no-await-in-loop
    const { Items = [], LastEvaluatedKey } = await dynamoClient.send(command);
    items.push(...Items);
    lastEvaluatedKey = LastEvaluatedKey || null;
  } while (lastEvaluatedKey);

  return items;
};
