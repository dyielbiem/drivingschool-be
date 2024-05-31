import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch the test of a chapter
---- /api/admin/section/chapter/test (GET)
*/
const fetchChapterTest = async (req, res) => {
  try {
    const { chapterID } = req.query;
    if (!chapterID) throw Error("Chapter ID must be provided");

    const getChapterCmd = new GetCommand({
      TableName: process.env.CHAPTER_TABLE,
      Key: {
        chapterID
      }
    });

    const { Item: chapter } = await dynamoClient.send(getChapterCmd);
    if (!chapter) throw Error("Chapter does not exist");

    const queryQuestionsCmd = new QueryCommand({
      TableName: process.env.QUESTION_TABLE,
      IndexName: "ChapterIndex",
      KeyConditionExpression: "chapterID = :chapterIDValue",
      ExpressionAttributeValues: {
        ":chapterIDValue": chapterID
      }
    });

    const { Items: test } = await dynamoClient.send(queryQuestionsCmd);
    if (test.length === 0)
      return res
        .status(200)
        .json({ noOfQuestionsToShow: chapter.noOfQuestionsToShow, test: [] });

    test.sort((a, b) => a.questionID.localeCompare(b.questionID));

    test.forEach((question) => {
      const choices = [...question.otherChoices, question.correctAnswer].sort(
        () => Math.random() - 0.5
      );

      Object.assign(question, {
        ...question,
        choices,
        otherChoices: undefined
      });
    });

    res
      .status(200)
      .json({ noOfQuestionsToShow: chapter.noOfQuestionsToShow, test });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchChapterTest;
