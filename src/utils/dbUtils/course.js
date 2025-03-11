import { GetCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";

export const getCourse = async (courseID) => {
  const command = new GetCommand({
    TableName: process.env.COURSE_TABLE,
    Key: {
      courseID: courseID
    }
  });

  const result = await dynamoClient.send(command);
  return result;
};
