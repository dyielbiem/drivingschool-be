import { GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to check if the student username
---- exists in a driving school
---- /api/student/username (GET)
*/
const checkStudentUserName = async (req, res) => {
  try {
    const { drivingSchoolID, studentUserName } = req.query;
    if (!drivingSchoolID || !studentUserName)
      throw Error("Driving school ID and student username must be provided");

    const command = new GetCommand({
      TableName: process.env.STUDENT_TABLE,
      Key: {
        drivingSchoolID,
        studentUserName
      }
    });

    const { Item: student } = await dynamoClient.send(command);
    if (student) throw Error("Username is already taken");

    res.status(200).json({ message: "Username is available" });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default checkStudentUserName;
