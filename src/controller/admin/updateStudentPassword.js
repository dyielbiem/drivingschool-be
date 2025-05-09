import bcrypt from "bcryptjs";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

// import { encrypt } from "../../utils/crypto.js";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to update the password of a student
---- /api/admin/student/password (PATCH)
*/
const updateStudentPassword = async (req, res) => {
  try {
    const { drivingSchoolID, studentUserName, newPassWord, confirmPassWord } =
      req.body;

    if (!studentUserName || !newPassWord || !confirmPassWord)
      throw Error("All required fields must be provided");

    if (newPassWord !== confirmPassWord) throw Error("Passwords do not match");

    const salt = await bcrypt.genSalt(10);
    const hashedPassWord = await bcrypt.hash(newPassWord, salt);

    // const encryptedPassWord = encrypt(newPassWord);

    const command = new UpdateCommand({
      TableName: process.env.STUDENT_TABLE,
      Key: {
        drivingSchoolID,
        studentUserName
      },
      UpdateExpression: "SET passWord = :passWord",
      // "SET passWord = :passWord, encryptedPassWord = :encryptedPassWord",
      ExpressionAttributeValues: {
        ":passWord": hashedPassWord
        // ":encryptedPassWord": encryptedPassWord
      },
      ConditionExpression:
        "attribute_exists(drivingSchoolID) AND attribute_exists(studentUserName)",
      ReturnValues: "ALL_NEW"
    });

    await dynamoClient.send(command);

    return res.status(200).json({
      message: "Student password has been updated"
    });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Student does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updateStudentPassword;
