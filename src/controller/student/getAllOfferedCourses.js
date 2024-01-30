import { QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to provide student with a list of all offered courses
---- /api/student/enroll/courses (GET)
*/
const getAllOfferedCourses = async (req, res) => {
  try {
    const { drivingSchoolID } = req.query;
    if (!drivingSchoolID) throw Error("Driving school ID must be provided");

    // Get the Authorize API log in and transaction key of the driving school
    const drivingSchoolCommand = new GetCommand({
      TableName: process.env.DRIVING_SCHOOL_TABLE,
      Key: {
        drivingSchoolID
      },
      ProjectionExpression:
        "drivingSchoolName, paymentLogInKey, paymentTransactionKey"
    });

    const { Item } = await dynamoClient.send(drivingSchoolCommand);

    if (!Item) throw Error("The driving school does not exist");

    // Get all the active courses offered by the driving school
    const coursesCommand = new QueryCommand({
      TableName: process.env.COURSE_TABLE,
      IndexName: "DrivingSchoolIndex",
      KeyConditionExpression: "drivingSchoolID = :drivingSchoolIDValue",
      FilterExpression: "isActive = :isActiveValue",
      ExpressionAttributeValues: {
        ":drivingSchoolIDValue": drivingSchoolID,
        ":isActiveValue": true
      },
      ProjectionExpression:
        "courseName, coursePrice, courseDesc, courseID, courseType, dateAdded"
    });

    const { Items } = await dynamoClient.send(coursesCommand);
    if (Object.keys(Items).length === 0) throw Error("No courses are offered");

    const sortedCourses = Items.sort(
      (a, b) => new Date(a.dateAdded) - new Date(b.dateAdded)
    );

    res.status(200).json({ ...Item, courses: sortedCourses });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};
export default getAllOfferedCourses;
