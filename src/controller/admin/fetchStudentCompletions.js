import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch a student test results
---- /api/admin/student/completion/list (GET)
*/
const fetchStudentCompletions = async (req, res) => {
  try {
    const { studentUserName } = req.query;
    const { drivingSchoolID } = req.body;

    if (!studentUserName) throw Error("Student username must be provided");

    const getStudentCommand = new GetCommand({
      TableName: process.env.STUDENT_TABLE,
      Key: {
        studentUserName,
        drivingSchoolID
      }
    });

    const { Item: student } = await dynamoClient.send(getStudentCommand);
    if (!student) throw Error("Student does not exist");

    const queryResultsCommand = new QueryCommand({
      TableName: process.env.RESULT_TABLE,
      IndexName: "StudentIndex",
      KeyConditionExpression:
        "studentUserName = :studentUserName AND drivingSchoolID = :drivingSchoolID",
      ExpressionAttributeValues: {
        ":studentUserName": studentUserName,
        ":drivingSchoolID": drivingSchoolID
      }
    });

    const { Items: testResults } = await dynamoClient.send(queryResultsCommand);
    testResults.sort((a, b) => {
      if (a.sectionID && !b.sectionID) return 1;
      if (b.sectionID && !a.sectionID) return -1;
      return b.resultID.localeCompare(a.resultID);
    });

    const queryChapterCommand = new QueryCommand({
      TableName: process.env.CHAPTER_TABLE,
      IndexName: "SectionIndex",
      KeyConditionExpression: "sectionID = :sectionID",
      ExpressionAttributeValues: {
        ":sectionID": student.sectionID
      }
    });

    const { Items: chapters } = await dynamoClient.send(queryChapterCommand);
    if (chapters.length === 0) throw Error("Section does not have any chapter");

    chapters.sort((a, b) => a.chapterID.localeCompare(b.chapterID));

    const sectionTestResult = testResults.find((item) => item.sectionID);

    const completions = chapters.map((chapter) => {
      const isChapterCompleted = student.completedChapters?.find(
        (item) => item.chapterID === chapter.chapterID
      );

      if (!isChapterCompleted)
        return {
          chapterID: chapter.chapterID,
          chapterTitle: chapter.chapterTitle,
          progressStatus: "Not completed"
        };

      const latestChapterResult = testResults.find(
        (item) => item.chapterID === chapter.chapterID
      );

      if (!latestChapterResult)
        return {
          chapterID: chapter.chapterID,
          chapterTitle: chapter.chapterTitle,
          progressStatus: "Completed",
          dateCompleted: isChapterCompleted.dateCompleted
        };

      const { score, numberOfQuestions, isPassed, dateAnswered } =
        latestChapterResult;

      return {
        chapterID: chapter.chapterID,
        chapterTitle: chapter.chapterTitle,
        progressStatus: isPassed ? "Completed" : "Exam not passed",
        score,
        numberOfQuestions,
        dateCompleted: dateAnswered
      };
    });

    completions.push({
      score: sectionTestResult?.score,
      numberOfQuestions: sectionTestResult?.numberOfQuestions,
      sectionID: student.sectionID,
      sectionTitle: "Final Test",
      progressStatus: !sectionTestResult
        ? "Not completed"
        : sectionTestResult?.isPassed
          ? "Completed"
          : "Exam not passed",
      dateCompleted: sectionTestResult?.dateAnswered
    });

    const querySubChaptersCommand = new QueryCommand({
      TableName: process.env.SUB_CHAPTER_TABLE,
      IndexName: "SectionIndex",
      KeyConditionExpression: "sectionID = :sectionID",
      ExpressionAttributeValues: {
        ":sectionID": student.sectionID
      }
    });

    const { Items: subChapters } = await dynamoClient.send(
      querySubChaptersCommand
    );

    res.status(200).json({
      completions,
      viewedSubChaptersCount: student.viewedSubChapters?.length || 0,
      totalSubChaptersCount: subChapters.length
    });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchStudentCompletions;
