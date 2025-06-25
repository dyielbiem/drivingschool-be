import passwordGenerator from "generate-password";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";
import { hashPassWord } from "../../utils/index.js";

/*
---- Controller to update the password of a student
---- /api/admin/student/password (PATCH)
*/
const updateStudentPassword = async (req, res) => {
  try {
    const { drivingSchoolID, studentUserName } = req.body;

    if (!studentUserName) throw Error("Student username is required");

    const passWord = passwordGenerator.generate({
      length: 16,
      numbers: true,
      symbols: true
    });
    const hashedPassWord = await hashPassWord(passWord);

    const command = new UpdateCommand({
      TableName: process.env.STUDENT_TABLE,
      Key: {
        drivingSchoolID,
        studentUserName
      },
      UpdateExpression: "SET passWord = :passWord",
      ExpressionAttributeValues: {
        ":passWord": hashedPassWord
      },
      ConditionExpression:
        "attribute_exists(drivingSchoolID) AND attribute_exists(studentUserName)",
      ReturnValues: "ALL_NEW"
    });

    await dynamoClient.send(command);

    return res.status(200).json({
      newPassword: passWord
    });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Student does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updateStudentPassword;
