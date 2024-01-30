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

    const result = await dynamoClient.send(command);
    if (result.Items.length === 0)
      return res.status(200).json({ allStudents: [] });

    const allStudents = result.Items.sort(
      (a, b) => new Date(a.enrollmentDate) - new Date(b.enrollmentDate)
    );

    res.status(200).json({ allStudents });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchAllStudentsPerSection;
