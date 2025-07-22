import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";

export const putAffiliation = async (affiliationData) => {
  const command = new PutCommand({
    TableName: process.env.AFFILIATION_TABLE,
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
    TableName: process.env.AFFILIATION_TABLE,
    IndexName: "AffiliationCodeIndex",
    KeyConditionExpression:
      "drivingSchoolID = :drivingSchoolID AND affiliationCode = :affiliationCode",
    ExpressionAttributeValues: {
      ":drivingSchoolID": drivingSchoolID,
      ":affiliationCode": affiliationCode
    }
  });

  const { Items = [] } = await dynamoClient.send(command);
  return Items.length === 0;
};

export const getAffiliationList = async (drivingSchoolID) => {
  const command = new QueryCommand({
    TableName: process.env.AFFILIATION_TABLE,
    IndexName: "DrivingSchoolIndex",
    KeyConditionExpression: "drivingSchoolID = :drivingSchoolID",
    ExpressionAttributeValues: {
      ":drivingSchoolID": drivingSchoolID
    }
  });

  const { Items = [] } = await dynamoClient.send(command);
  return Items;
};
