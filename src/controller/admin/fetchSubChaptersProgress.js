import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch all the sub-chapters progress of a chapter
---- /api/admin/section/chapter/subchapter/progress/list (GET)
*/
const fetchSubChaptersProgress = async (req, res) => {
  try {
    const { chapterID, studentUserName } = req.query;
    const { drivingSchoolID } = req.body;

    if (!chapterID || !studentUserName)
      throw Error("All required fields must be provided");

    const getStudentCmd = new GetCommand({
      TableName: process.env.STUDENT_TABLE,
      Key: {
        studentUserName,
        drivingSchoolID
      },
      ProjectionExpression:
        "viewedSubChapters, studentUserName, drivingSchoolID"
    });

    const { Item: student } = await dynamoClient.send(getStudentCmd);
    if (!student) throw Error("Student does not exist");

    const querySubChaptersCmd = new QueryCommand({
      TableName: process.env.SUB_CHAPTER_TABLE,
      IndexName: "ChapterIndex",
      KeyConditionExpression: "chapterID = :chapterIDValue",
      ExpressionAttributeValues: {
        ":chapterIDValue": chapterID
      },
      ProjectionExpression: "subChapterTitle, subChapterID, orderID"
    });

    const { Items: subChapters } = await dynamoClient.send(querySubChaptersCmd);
    if (subChapters.length === 0)
      return res.status(200).json({ subChaptersProgress: [] });

    subChapters.sort((a, b) => a.orderID - b.orderID);

    const viewedSubChapters = student.viewedSubChapters || [];

    subChapters.forEach((item) => {
      if (viewedSubChapters.length === 0) {
        return Object.assign(item, { ...item, isViewed: false });
      }

      const isViewed = viewedSubChapters.find(
        (viewedItem) => viewedItem.subChapterID === item.subChapterID
      );

      if (!isViewed) {
        return Object.assign(item, { ...item, isViewed: false });
      }

      Object.assign(item, {
        ...item,
        isViewed: true,
        dateViewed: isViewed.dateViewed
      });
    });

    res.status(200).json({ subChaptersProgress: subChapters });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchSubChaptersProgress;
