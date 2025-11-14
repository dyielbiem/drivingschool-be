import { QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";

export const getSectionSubChapters = async (sectionID) => {
  const command = new QueryCommand({
    TableName: process.env.SUB_CHAPTER_TABLE,
    IndexName: "SectionIndex",
    KeyConditionExpression: "sectionID = :sectionID",
    ExpressionAttributeValues: {
      ":sectionID": sectionID
    }
  });

  const result = await dynamoClient.send(command);
  return result;
};

export const getSubChapter = async (subChapterID) => {
  const command = new GetCommand({
    TableName: process.env.SUB_CHAPTER_TABLE,
    Key: {
      subChapterID
    }
  });

  const result = await dynamoClient.send(command);
  return result;
};
