import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to delete an enrolled student
---- /api/admin/student (DELETE)
*/
const deleteStudent = async (req, res) => {
  try {
    const { studentUserName, drivingSchoolID } = req.body;

    if (!studentUserName) throw Error("Student username must be provided");

    const deleteCommand = new DeleteCommand({
      TableName: process.env.STUDENT_TABLE,
      Key: {
        drivingSchoolID,
        studentUserName
      },
      ConditionExpression:
        "attribute_exists(drivingSchoolID) AND attribute_exists(studentUserName)",
      ReturnValues: "ALL_OLD"
    });

    const deleteResponse = await dynamoClient.send(deleteCommand);

    res.status(200).json(deleteResponse);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Student does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default deleteStudent;
