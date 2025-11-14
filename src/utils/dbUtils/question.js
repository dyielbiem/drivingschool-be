import { QueryCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";

export const getDrivingSchoolQuestions = async (
  drivingSchoolID,
  otherArgs = {}
) => {
  const command = new QueryCommand({
    TableName: process.env.QUESTION_TABLE,
    IndexName: "DrivingSchoolIndex",
    KeyConditionExpression: "drivingSchoolID = :drivingSchoolID",
    ExpressionAttributeValues: {
      ":drivingSchoolID": drivingSchoolID
    },
    ...otherArgs
  });

  const result = await dynamoClient.send(command);
  return result;
};

export const getSectionQuestions = async (sectionID, otherArgs = {}) => {
  const command = new QueryCommand({
    TableName: process.env.QUESTION_TABLE,
    IndexName: "SectionIndex",
    KeyConditionExpression: "sectionID = :sectionID",
    ExpressionAttributeValues: {
      ":sectionID": sectionID
    },
    ...otherArgs
  });

  const result = await dynamoClient.send(command);
  return result;
};
