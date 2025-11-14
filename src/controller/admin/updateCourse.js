import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to update a course of a driving school
---- /api/admin/course (PATCH)
*/
const updateCourse = async (req, res) => {
  try {
    const { courseID, courseName, coursePrice, courseDesc, isActive } =
      req.body;
    if (!courseName || !courseID || !coursePrice || isActive === undefined)
      throw Error("All required fields must be provided");
    if (typeof coursePrice !== "number")
      throw Error("Course price must be a number");
    if (typeof isActive !== "boolean")
      throw Error("isActive must be a boolean");

    const command = new UpdateCommand({
      TableName: process.env.COURSE_TABLE,
      Key: {
        courseID
      },
      UpdateExpression:
        "SET courseName = :courseName, " +
        "coursePrice = :coursePrice, " +
        "courseDesc = :courseDesc, " +
        "isActive = :isActive",
      ExpressionAttributeValues: {
        ":courseName": courseName,
        ":coursePrice": coursePrice,
        ":courseDesc": courseDesc || "",
        ":isActive": isActive
      },
      ConditionExpression: "attribute_exists(courseID)",
      ReturnValues: "ALL_NEW"
    });

    const { Attributes: updatedCourse } = await dynamoClient.send(command);

    return res.status(200).json(updatedCourse);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Course does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updateCourse;
