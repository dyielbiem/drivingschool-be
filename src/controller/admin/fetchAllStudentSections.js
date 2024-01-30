import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch all the sections and 
---- the total number of students per section
---- /api/admin/student/section/list (GET)
*/
const fetchAllStudentSections = async (req, res) => {
  try {
    const { drivingSchoolID } = req.body;

    const sectionCommand = new QueryCommand({
      TableName: process.env.SECTION_TABLE,
      IndexName: "DrivingSchoolIndex",
      KeyConditionExpression: "drivingSchoolID = :drivingSchoolIDValue",
      ExpressionAttributeValues: {
        ":drivingSchoolIDValue": drivingSchoolID
      },
      ProjectionExpression: "sectionID, sectionTitle, isActive"
    });

    const { Items: sectionResult } = await dynamoClient.send(sectionCommand);
    if (sectionResult.length === 0)
      return res.status(200).json({ studentSections: [] });

    const studentCommand = new QueryCommand({
      TableName: process.env.STUDENT_TABLE,
      IndexName: "DrivingSchoolIndex",
      KeyConditionExpression: "drivingSchoolID = :drivingSchoolIDValue",
      ExpressionAttributeValues: {
        ":drivingSchoolIDValue": drivingSchoolID
      },
      ProjectionExpression: "studentUserName, drivingSchoolID, sectionID"
    });

    const { Items: studentResult } = await dynamoClient.send(studentCommand);

    // Return all the sections containing zero students
    if (studentResult.length === 0) {
      const emptyStudentSections = sectionResult.map((section) => ({
        ...section,
        NoOfStudents: 0
      }));

      return res.status(200).json({ studentSections: emptyStudentSections });
    }

    // Get the total number of students per section
    const groupStudentsBySection = studentResult.reduce(
      (accumulator, currentItem) => {
        const itemExist = accumulator.find(
          (item) => item.sectionID === currentItem.sectionID
        );

        if (itemExist) {
          itemExist.NoOfStudents += 1;
          return accumulator;
        }

        accumulator.push({ ...currentItem, NoOfStudents: 1 });
        return accumulator;
      },
      []
    );

    // If section exist, add the chapter title
    // Else, insert the section then set the total students to zero
    sectionResult.forEach((item) => {
      const itemIndex = groupStudentsBySection.findIndex(
        (group) => group.sectionID === item.sectionID
      );

      if (itemIndex === -1)
        return groupStudentsBySection.push({ ...item, NoOfStudents: 0 });

      groupStudentsBySection[itemIndex].sectionTitle = item.sectionTitle;
      groupStudentsBySection[itemIndex].isActive = item.isActive;
      delete groupStudentsBySection[itemIndex].studentUserName;
      delete groupStudentsBySection[itemIndex].drivingSchoolID;
    });

    const sortedStudentSections = groupStudentsBySection.sort((a, b) =>
      b.sectionID.localeCompare(a.sectionID)
    );

    res.status(200).json({
      studentSections: sortedStudentSections
    });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchAllStudentSections;
