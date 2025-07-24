import { QueryCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";

export const getSectionChapters = async (sectionID, otherArgs = {}) => {
  const command = new QueryCommand({
    TableName: process.env.CHAPTER_TABLE,
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
