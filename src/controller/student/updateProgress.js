import { GetCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to update the progress of a student
---- /api/student/progress (PATCH)
*/
const updateProgress = async (req, res) => {
  try {
    const { subChapterID, drivingSchoolID, studentUserName } = req.body;
    if (!subChapterID) throw Error("Sub-chapter ID must be provided");

    // Verify if sub-chapter exists
    const getSubChapterCmd = new GetCommand({
      TableName: process.env.SUB_CHAPTER_TABLE,
      Key: {
        subChapterID
      }
    });

    const { Item: subChapter } = await dynamoClient.send(getSubChapterCmd);
    if (!subChapter) throw Error("Sub-chapter does not exist");

    // Query all the sub-chapter siblings
    const querySubChaptersCmd = new QueryCommand({
      TableName: process.env.SUB_CHAPTER_TABLE,
      IndexName: "ChapterIndex",
      KeyConditionExpression: "chapterID = :chapterID",
      ExpressionAttributeValues: {
        ":chapterID": subChapter.chapterID
      }
    });

    const { Items: subChapterList } =
      await dynamoClient.send(querySubChaptersCmd);

    // Verify if the student exists
    const getStudentCmd = new GetCommand({
      TableName: process.env.STUDENT_TABLE,
      Key: {
        drivingSchoolID,
        studentUserName
      }
    });

    const { Item: student } = await dynamoClient.send(getStudentCmd);
    if (!student) throw Error("Student does not exist");

    const { viewedSubChapter, completedChapters } = student;

    // Check if the sub-chapter is already viewed
    if (viewedSubChapter?.includes(subChapterID))
      throw Error("Sub-chapter is already viewed");

    const updatedViewedSubChapter = [...(viewedSubChapter || []), subChapterID];

    // Update progress expression and attributes
    let updateProgressExpression = "SET viewedSubChapter = :viewedSubChapter";
    const updateProgressAttributes = {
      ":viewedSubChapter": updatedViewedSubChapter
    };

    // Check if all the sub-chapter siblings are viewed
    const allSubChapterViewed = subChapterList.every((item) =>
      updatedViewedSubChapter.includes(item.subChapterID)
    );

    // If all sub-chapters siblings are viewed, and chapter has no test,
    // update the update progress expression and attributes
    if (allSubChapterViewed) {
      const queryChapterQuestionsCmd = new QueryCommand({
        TableName: process.env.QUESTION_TABLE,
        IndexName: "ChapterIndex",
        KeyConditionExpression: "chapterID = :chapterID",
        ExpressionAttributeValues: {
          ":chapterID": subChapter.chapterID
        },
        Limit: 1
      });

      const { Items: chapterQuestions } = await dynamoClient.send(
        queryChapterQuestionsCmd
      );

      if (chapterQuestions.length === 0) {
        const updatedCompletedChapters = [
          ...(completedChapters || []),
          subChapter.chapterID
        ];

        updateProgressExpression += ", completedChapters = :completedChapters";
        updateProgressAttributes[":completedChapters"] =
          updatedCompletedChapters;
      }
    }

    // Update the viewed sub-chapters of the student
    const updateViewedSubChapterCmd = new UpdateCommand({
      TableName: process.env.STUDENT_TABLE,
      Key: {
        studentUserName,
        drivingSchoolID
      },
      UpdateExpression: updateProgressExpression,
      ExpressionAttributeValues: updateProgressAttributes,
      ConditionExpression:
        "attribute_exists(drivingSchoolID) AND attribute_exists(studentUserName)"
    });

    await dynamoClient.send(updateViewedSubChapterCmd);

    res.status(200).json({ message: "Student progress has been updated" });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Student does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updateProgress;
