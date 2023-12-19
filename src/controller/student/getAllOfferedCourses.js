import { ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to provide student with a list of all offered courses
---- /api/student/enroll/courses (GET)
*/
const getAllOfferedCourses = async (req, res) => {
  try {
    const drivingSchoolName = req.query.drivingSchoolName;
    if (!drivingSchoolName) throw Error("Driving school name must be provided");

    const drivingSchoolCommand = new GetCommand({
      TableName: process.env.DRIVING_SCHOOL_TABLE,
      Key: {
        drivingSchoolName,
      },
      ProjectionExpression:
        "drivingSchoolName, paymentLogInKey, paymentTransactionKey",
    });

    const { Item } = await dynamoClient.send(drivingSchoolCommand);

    if (!Item) throw Error("The driving school does not exist");

    const coursesCommand = new ScanCommand({
      TableName: process.env.COURSE_TABLE,
      FilterExpression:
        "drivingSchoolName = :drivingSchoolName AND isActive = :isActive",
      ExpressionAttributeValues: {
        ":drivingSchoolName": drivingSchoolName,
        ":isActive": { BOOL: true },
      },
      ProjectionExpression: "courseName, coursePrice, courseDesc",
    });

    const { Items } = await dynamoClient.send(coursesCommand);

    if (Object.keys(Items).length === 0) throw Error("No courses are offered");

    res.status(200).json({ ...Item, courses: [...Items] });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};
export default getAllOfferedCourses;
