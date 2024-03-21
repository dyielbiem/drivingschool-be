import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch the test of a chapter
---- /api/student/section/chapter/test (GET)
*/
const fetchChapterTest = async (req, res) => {
  try {
    const { chapterID } = req.query;
    if (!chapterID) throw Error("Chapter ID must be provided");

    const command = new QueryCommand({
      TableName: process.env.QUESTION_TABLE,
      IndexName: "ChapterIndex",
      KeyConditionExpression: "chapterID = :chapterIDValue",
      ExpressionAttributeValues: {
        ":chapterIDValue": chapterID
      },
      ProjectionExpression: "questionID, question, otherChoices, correctAnswer"
    });

    const result = await dynamoClient.send(command);
    if (result.Items.length === 0) return res.status(200).json({ test: [] });

    const test = result.Items.sort((a, b) =>
      a.questionID.localeCompare(b.questionID)
    );

    test.forEach((question) => {
      const choices = [...question.otherChoices, question.correctAnswer].sort(
        () => Math.random() - 0.5
      );

      Object.assign(question, {
        ...question,
        choices,
        otherChoices: undefined,
        correctAnswer: undefined
      });
    });

    res.status(200).json({ test });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchChapterTest;
