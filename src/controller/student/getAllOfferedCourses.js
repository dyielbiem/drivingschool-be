import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to provide student with a list of all offered courses
---- /api/student/enroll/courses (GET)
*/
const getAllOfferedCourses = async (req, res) => {
  try {
    const drivingSchoolName = req.query.drivingSchoolName;
    if (!drivingSchoolName) throw Error("Driving school name must be provided");

    const command = new ScanCommand({
      TableName: process.env.COURSE_TABLE,
      FilterExpression:
        "drivingSchoolName = :drivingSchoolName AND isActive = :isActive",
      ExpressionAttributeValues: {
        ":drivingSchoolName": drivingSchoolName,
        ":isActive": { BOOL: true },
      },
      ProjectionExpression:
        "drivingSchoolName, courseName, coursePrice, courseDesc",
    });

    const { Items } = await dynamoClient.send(command);

    if (Object.keys(Items).length === 0) throw Error("No courses are offered");

    res.status(200).json({ Items });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};
export default getAllOfferedCourses;
