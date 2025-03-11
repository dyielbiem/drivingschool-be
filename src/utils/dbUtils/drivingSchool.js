import { GetCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";

export const getDrivingSchool = async (id) => {
  const command = new GetCommand({
    TableName: process.env.DRIVING_SCHOOL_TABLE,
    Key: {
      drivingSchoolID: id
    }
  });

  const result = await dynamoClient.send(command);
  return result;
};
