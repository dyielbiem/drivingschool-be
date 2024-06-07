import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch the chapters of a section
---- /api/student/section/chapter/list (GET)
*/
const fetchAllChapters = async (req, res) => {
  try {
    const { sectionID } = req.query;
    const { drivingSchoolID, studentUserName } = req.body;
    if (!sectionID) throw Error("Section ID must be provided");

    const getStudentCmd = new GetCommand({
      TableName: process.env.STUDENT_TABLE,
      Key: {
        studentUserName,
        drivingSchoolID
      }
    });

    const { Item: student } = await dynamoClient.send(getStudentCmd);
    if (!student) throw Error("Student does not exist");

    const chapterCommand = new QueryCommand({
      TableName: process.env.CHAPTER_TABLE,
      IndexName: "SectionIndex",
      KeyConditionExpression: "sectionID = :sectionIDValue",
      ExpressionAttributeValues: {
        ":sectionIDValue": sectionID
      },
      ProjectionExpression: "chapterID, chapterTitle, chapterContent"
    });

    const { Items: chapters } = await dynamoClient.send(chapterCommand);

    if (chapters.length === 0) return res.status(200).json({ chapters: [] });

    chapters.sort((a, b) => a.chapterID.localeCompare(b.chapterID));

    const chapterTestCommand = new QueryCommand({
      TableName: process.env.RESULT_TABLE,
      IndexName: "StudentIndex",
      KeyConditionExpression:
        "drivingSchoolID = :drivingSchoolIDValue AND studentUserName = :studentUserNameValue",
      FilterExpression: "attribute_exists(chapterID)",
      ExpressionAttributeValues: {
        ":drivingSchoolIDValue": drivingSchoolID,
        ":studentUserNameValue": studentUserName
      }
    });

    const { Items: chapterTestResults } =
      await dynamoClient.send(chapterTestCommand);

    if (chapterTestResults?.length === 0)
      return res.status(200).json({ chapters });

    chapterTestResults.sort((a, b) => b.resultID.localeCompare(a.resultID));

    chapters.forEach((currentChapter) => {
      const { completedChapters } = student;
      const isCompleted =
        completedChapters?.includes(currentChapter.chapterID) || false;
      const testResult = chapterTestResults.find(
        (eachResult) => eachResult.chapterID === currentChapter.chapterID
      );

      Object.assign(currentChapter, {
        ...currentChapter,
        isCompleted,
        testResult
      });
    });

    res.status(200).json({ chapters });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchAllChapters;
