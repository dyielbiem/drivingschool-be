import { PutCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to log in an admin
---- /api/admin/login (POST)
*/
const addCourse = async (req, res) => {
  try {
    const {
      adminUserName,
      drivingSchoolName,
      courseName,
      coursePrice,
      courseDesc,
      courseType,
    } = req.body;

    if (!courseName || !coursePrice || !courseType)
      throw Error("All required fields must be filled");

    const command = new PutCommand({
      TableName: process.env.COURSE_TABLE,
      Item: {
        drivingSchoolName,
        courseName,
        coursePrice: { N: coursePrice },
        courseDesc,
        courseType,
        isActive: { BOOL: true },
        addedBy: adminUserName,
        dateAdded: Date(),
      },
      ConditionExpression:
        "attribute_not_exists(drivingSchoolName) AND attribute_not_exists(courseName)",
    });

    const result = await dynamoClient.send(command);

    res.status(200).json(result);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Course already exists" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default addCourse;
