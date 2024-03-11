import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch all the students of a section
---- /api/admin/student/all (GET)
*/
const fetchAllStudentsPerSection = async (req, res) => {
  try {
    const { drivingSchoolID } = req.body;
    const { sectionID } = req.query;

    if (!sectionID) throw Error("Section ID must be provided");

    const getChaptersCommand = new QueryCommand({
      TableName: process.env.CHAPTER_TABLE,
      IndexName: "SectionIndex",
      KeyConditionExpression: "sectionID = :sectionIDValue",
      ExpressionAttributeValues: {
        ":sectionIDValue": sectionID
      }
    });

    const { Items: chapters } = await dynamoClient.send(getChaptersCommand);
    if (chapters.length === 0) throw Error("Section does not have chapters");

    const sortedChapters = chapters.sort((a, b) =>
      a.chapterID.localeCompare(b.chapterID)
    );

    const command = new QueryCommand({
      TableName: process.env.STUDENT_TABLE,
      IndexName: "DrivingSchoolIndex",
      KeyConditionExpression: "drivingSchoolID = :drivingSchoolIDValue",
      FilterExpression: "sectionID = :sectionIDValue",
      ExpressionAttributeValues: {
        ":drivingSchoolIDValue": drivingSchoolID,
        ":sectionIDValue": sectionID
      }
    });

    const { Items: students } = await dynamoClient.send(command);
    if (students.length === 0) return res.status(200).json({ allStudents: [] });

    // Set the chpater title to progress name
    students.forEach((student) => {
      if (!student.progressID) return;
      const chapterNumber = sortedChapters.findIndex(
        (obj) => obj.chapterID === student.progressID
      );

      if (chapterNumber < 0) return;

      Object.assign(student, {
        ...student,
        chapterProgress: chapterNumber + 1
      });
    });

    const allStudents = students.sort(
      (a, b) => new Date(a.enrollmentDate) - new Date(b.enrollmentDate)
    );

    res.status(200).json({ allStudents });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchAllStudentsPerSection;
