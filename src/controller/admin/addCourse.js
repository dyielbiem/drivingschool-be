import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to add a course
---- /api/admin/course (POST)
*/
const addCourse = async (req, res) => {
  try {
    const {
      adminUserName,
      drivingSchoolID,
      courseName,
      coursePrice,
      courseDesc,
      courseType
    } = req.body;

    if (!courseName || !coursePrice || !courseType)
      throw Error("All required fields must be filled");

    // Check if course is already existing
    const checkCourseCommand = new QueryCommand({
      TableName: process.env.COURSE_TABLE,
      IndexName: "DrivingSchoolIndex",
      KeyConditionExpression: "drivingSchoolID = :drivingSchoolIDValue",
      FilterExpression: "courseName = :courseNameValue",
      ExpressionAttributeValues: {
        ":drivingSchoolIDValue": drivingSchoolID,
        ":courseNameValue": courseName
      }
    });

    const { Items } = await dynamoClient.send(checkCourseCommand);
    if (Items.length > 0) throw Error("The course already exists");

    // If course does not exist, add it to the database
    const courseID = nanoid();
    const putCommand = new PutCommand({
      TableName: process.env.COURSE_TABLE,
      Item: {
        courseID,
        drivingSchoolID,
        courseName,
        coursePrice: Number(coursePrice),
        courseDesc,
        courseType,
        isActive: true,
        addedBy: adminUserName,
        dateAdded: Date()
      },
      ConditionExpression: "attribute_not_exists(courseID)"
    });

    await dynamoClient.send(putCommand);

    res.status(200).json({
      drivingSchoolID,
      courseID,
      courseName,
      courseDesc,
      coursePrice,
      courseType
    });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res
        .status(400)
        .json({ error: "An error occurred, please try again" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default addCourse;
