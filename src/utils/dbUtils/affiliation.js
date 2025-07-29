import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand
} from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";

const TableName = process.env.AFFILIATION_TABLE;

export const getAffiliationByID = async (affiliationID) => {
  const command = new GetCommand({
    TableName,
    Key: {
      affiliationID
    }
  });

  const { Item } = await dynamoClient.send(command);
  return Item;
};

export const putAffiliation = async (affiliationData) => {
  const command = new PutCommand({
    TableName,
    Item: affiliationData,
    ConditionExpression: "attribute_not_exists(affiliationID)"
  });

  const results = await dynamoClient.send(command);

  return results;
};

export const isAffiliationCodeAvailable = async (
  drivingSchoolID,
  affiliationCode
) => {
  const command = new QueryCommand({
    TableName,
    IndexName: "AffiliationCodeIndex",
    KeyConditionExpression:
      "drivingSchoolID = :drivingSchoolID AND affiliationCode = :affiliationCode",
    ExpressionAttributeValues: {
      ":drivingSchoolID": drivingSchoolID,
      ":affiliationCode": affiliationCode
    },
    Limit: 1
  });

  const { Items = [] } = await dynamoClient.send(command);
  return { isAvailable: Items.length === 0, existingAffiliation: Items[0] };
};

export const getAffiliationByCode = async (
  drivingSchoolID,
  affiliationCode
) => {
  const command = new QueryCommand({
    TableName,
    IndexName: "AffiliationCodeIndex",
    KeyConditionExpression:
      "drivingSchoolID = :drivingSchoolID AND affiliationCode = :affiliationCode",
    ExpressionAttributeValues: {
      ":drivingSchoolID": drivingSchoolID,
      ":affiliationCode": affiliationCode
    },
    Limit: 1
  });

  const { Items = [] } = await dynamoClient.send(command);
  return Items[0];
};

export const getAffiliationList = async (drivingSchoolID) => {
  const command = new QueryCommand({
    TableName,
    IndexName: "DrivingSchoolIndex",
    KeyConditionExpression: "drivingSchoolID = :drivingSchoolID",
    ExpressionAttributeValues: {
      ":drivingSchoolID": drivingSchoolID
    }
  });

  const { Items = [] } = await dynamoClient.send(command);
  return Items;
};

export const updateAffiliationItem = async (affiliationID, attribute) => {
  const UpdateExpression = `SET ${Object.keys(attribute)
    .map((key) => `${key.slice(1)} = ${key}`)
    .join(",")}`;

  const command = new UpdateCommand({
    TableName,
    Key: {
      affiliationID
    },
    UpdateExpression,
    ConditionExpression: "attribute_exists(affiliationID)",
    ExpressionAttributeValues: attribute,
    ReturnValues: "ALL_NEW"
  });

  const { Attributes = {} } = await dynamoClient.send(command);
  return Attributes;
};

export const deleteAffiliationItem = async (affiliationID) => {
  const command = new DeleteCommand({
    TableName,
    Key: {
      affiliationID
    },
    ConditionExpression: "attribute_exists(affiliationID)"
  });

  await dynamoClient.send(command);
};
