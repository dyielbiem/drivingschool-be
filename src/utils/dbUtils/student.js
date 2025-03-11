import { GetCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";

export const getStudent = async (drivingSchoolID, studentUserName) => {
  const command = new GetCommand({
    TableName: process.env.STUDENT_TABLE,
    Key: {
      drivingSchoolID,
      studentUserName
    }
  });

  const result = await dynamoClient.send(command);
  return result;
};
