import { GetCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch a student test results
---- /api/admin/student/test/result/list (GET)
*/
const fetchStudentResults = async (req, res) => {
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

    const queryQuestionsCommand = new ScanCommand({
      TableName: process.env.QUESTION_TABLE,
      FilterExpression: "drivingSchoolID = :drivingSchoolID",
      ExpressionAttributeValues: {
        ":drivingSchoolID": drivingSchoolID
      }
    });

    const { Items: questions } = await dynamoClient.send(queryQuestionsCommand);
    if (questions.length === 0) throw Error("Driving school has no tests");

    testResults.sort((a, b) => {
      if (a.sectionID && !b.sectionID) return 1;
      if (b.sectionID && !a.sectionID) return -1;
      return b.resultID.localeCompare(a.resultID);
    });

    const latestTestResults = [];
    chapters.forEach((chapter, index) => {
      const chapterTestResult = testResults.find(
        (test) => test.chapterID === chapter.chapterID
      );

      const hasTest = questions.find(
        (question) => question.chapterID === chapter.chapterID
      );

      latestTestResults.push({
        ...chapterTestResult,
        chapterTitle: chapter.chapterTitle,
        chapterID: chapter.chapterID,
        hasTest: !!hasTest
      });

      if (index !== chapters.length - 1) return;

      const sectionTestResult = testResults.find((test) => test.sectionID);
      latestTestResults.push(
        sectionTestResult || { sectionID: student.sectionID }
      );
    });

    res.status(200).json({ latestTestResults });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchStudentResults;
