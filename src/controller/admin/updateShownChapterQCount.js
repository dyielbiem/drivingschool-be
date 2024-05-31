import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to update the number of chapter question 
---- that needed to be answered by the students
---- /api/admin/section/chapter/question/shown-count
*/
const updateShownChapterQCount = async (req, res) => {
  try {
    const { chapterID, noOfQuestionsToShow } = req.body;
    if (!chapterID) throw Error("Chapter ID must be provided");

    if (
      noOfQuestionsToShow &&
      (!Number.isInteger(noOfQuestionsToShow) || noOfQuestionsToShow < 1)
    )
      throw Error("Number of questions to show must be a positive integer");

    const queryQuestionsCmd = new QueryCommand({
      TableName: process.env.QUESTION_TABLE,
      IndexName: "ChapterIndex",
      KeyConditionExpression: "chapterID = :chapterID",
      ExpressionAttributeValues: {
        ":chapterID": chapterID
      }
    });

    const { Items: questions } = await dynamoClient.send(queryQuestionsCmd);
    if (questions.length === 0)
      throw Error("Chapter does not have any test question");

    if (questions.length < noOfQuestionsToShow)
      throw Error(
        "Number of questions to show is more than the number of chapter questions"
      );

    const updateChapterCmd = new UpdateCommand({
      TableName: process.env.CHAPTER_TABLE,
      Key: {
        chapterID
      },
      UpdateExpression: "SET noOfQuestionsToShow = :noOfQuestionsToShow",
      ExpressionAttributeValues: {
        ":noOfQuestionsToShow": noOfQuestionsToShow || null
      },
      ConditionExpression: "attribute_exists(chapterID)"
    });

    await dynamoClient.send(updateChapterCmd);

    return res
      .status(200)
      .json({ message: "Number of questions to show has been updated" });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Chapter does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updateShownChapterQCount;
