import { QueryCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";

export const getStudentResults = async (
  drivingSchoolID,
  studentUserName,
  otherArgs = {}
) => {
  const command = new QueryCommand({
    TableName: process.env.RESULT_TABLE,
    IndexName: "StudentIndex",
    KeyConditionExpression:
      "drivingSchoolID = :drivingSchoolIDValue AND studentUserName = :studentUserNameValue",
    ExpressionAttributeValues: {
      ":drivingSchoolIDValue": drivingSchoolID,
      ":studentUserNameValue": studentUserName
    },
    ...otherArgs
  });

  const result = await dynamoClient.send(command);
  return result;
};
