import { QueryCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

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

export const updateChapterOrder = async (set) => {
  const TransactItems = set.slice(0, 25).map((item, idx) => {
    const { chapterID } = item;

    return {
      Update: {
        TableName: process.env.CHAPTER_TABLE,
        Key: {
          chapterID
        },
        UpdateExpression: "SET chapterOrder = :chapterOrder",
        ExpressionAttributeValues: {
          ":chapterOrder": idx + 1
        },
        ConditionExpression: "attribute_exists(chapterID)"
      }
    };
  });

  const command = new TransactWriteCommand({ TransactItems });
  return dynamoClient.send(command);
};
