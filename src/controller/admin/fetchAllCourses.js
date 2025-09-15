import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch all the offered courses of a driving school
---- /api/admin/course/list (GET)
*/
const fetchAllCourses = async (req, res) => {
  try {
    const { drivingSchoolID } = req.body;

    const command = new QueryCommand({
      TableName: process.env.COURSE_TABLE,
      IndexName: "DrivingSchoolIndex",
      KeyConditionExpression: "drivingSchoolID = :drivingSchoolID",
      FilterExpression: "isDeleted <> :isDeleted",
      ExpressionAttributeValues: {
        ":drivingSchoolID": drivingSchoolID,
        ":isDeleted": true
      }
    });

    const result = await dynamoClient.send(command);
    if (result.Items.length === 0) return res.status(200).json({ courses: [] });

    const sortedCourses = result.Items.sort(
      (a, b) => new Date(a.dateAdded) - new Date(b.dateAdded)
    );

    res.status(200).json({ courses: sortedCourses });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchAllCourses;
