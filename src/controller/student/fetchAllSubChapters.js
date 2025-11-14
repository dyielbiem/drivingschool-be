import { QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch the sub-chapters of a chapter
---- /api/student/section/chapter/subchapter/list (GET)
*/
const fetchAllSubChapters = async (req, res) => {
  try {
    const { chapterID } = req.query;
    const { drivingSchoolID, studentUserName } = req.body;
    if (!chapterID) throw Error("Chapter ID must be provided");

    const getStudentCmd = new GetCommand({
      TableName: process.env.STUDENT_TABLE,
      Key: {
        studentUserName,
        drivingSchoolID
      }
    });

    const { Item: student } = await dynamoClient.send(getStudentCmd);
    if (!student) throw Error("Student does not exist");

    const command = new QueryCommand({
      TableName: process.env.SUB_CHAPTER_TABLE,
      IndexName: "ChapterIndex",
      KeyConditionExpression: "chapterID = :chapterIDValue",
      ExpressionAttributeValues: {
        ":chapterIDValue": chapterID
      },
      ProjectionExpression: "subChapterID, subChapterTitle, orderID"
    });

    const { Items: subChapters } = await dynamoClient.send(command);

    if (subChapters.length === 0)
      return res.status(200).json({ subChapters: [] });

    const sortedSubChapters = subChapters.sort((a, b) => a.orderID - b.orderID);

    sortedSubChapters.forEach((currentSubChapter) => {
      const { viewedSubChapters } = student;
      const isViewed =
        viewedSubChapters?.some(
          (item) => item.subChapterID === currentSubChapter.subChapterID
        ) || false;

      Object.assign(currentSubChapter, { ...currentSubChapter, isViewed });
    });

    res.status(200).json({ subChapters: sortedSubChapters });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchAllSubChapters;
