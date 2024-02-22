import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to delete a course of a driving school
---- /api/admin/course (DELETE)
*/
const deleteCourse = async (req, res) => {
  try {
    const { courseID } = req.query;
    if (!courseID) throw Error("Course ID must be provided");

    const command = new DeleteCommand({
      TableName: process.env.COURSE_TABLE,
      Key: {
        courseID
      },
      ConditionExpression: "attribute_exists(courseID)",
      ReturnValues: "ALL_OLD"
    });

    const response = await dynamoClient.send(command);

    return res.status(200).json(response);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Course does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default deleteCourse;
