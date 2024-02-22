import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to update the status of a student
---- /api/admin/student/status (PATCH)
*/
const updateStudentStatus = async (req, res) => {
  try {
    const { drivingSchoolID, studentUserName, isActive } = req.body;
    if (!studentUserName || isActive === undefined)
      throw Error("All required fields must be provided");
    if (typeof isActive !== "boolean")
      throw Error("isActive must be a boolean");

    const command = new UpdateCommand({
      TableName: process.env.STUDENT_TABLE,
      Key: {
        drivingSchoolID,
        studentUserName
      },
      UpdateExpression: "SET isActive = :isActiveValue",
      ExpressionAttributeValues: {
        ":isActiveValue": isActive
      },
      ConditionExpression:
        "attribute_exists(studentUserName) AND attribute_exists(drivingSchoolID)",
      ReturnValues: "ALL_NEW"
    });

    const { Attributes: updatedStudent } = await dynamoClient.send(command);

    return res.status(200).json(updatedStudent);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Student does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updateStudentStatus;
