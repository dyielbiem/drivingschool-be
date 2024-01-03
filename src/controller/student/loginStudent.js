import { GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/*
---- Controller to fetch the test of a chapter
---- /api/student/section/chapter/test (POST)
*/
const loginStudent = async (req, res) => {
  try {
    const { drivingSchoolID, userName, passWord } = req.body;
    if (!userName || !passWord || !drivingSchoolID)
      throw Error("All required fields must be filled");

    const command = new GetCommand({
      TableName: process.env.STUDENT_TABLE,
      Key: {
        drivingSchoolID,
        studentUserName: userName,
      },
    });

    const { Item } = await dynamoClient.send(command);
    if (!Item) throw Error("Username or password is incorrect");

    const isPasswordCorrect = await bcrypt.compare(passWord, Item.passWord);

    if (!isPasswordCorrect) throw Error("Username or password is incorrect");

    const token = jwt.sign(
      { studentUserName: userName, drivingSchoolID },
      process.env.STUDENT_JWT_SECRET,
      {
        expiresIn: "3h",
      }
    );

    res.status(200).json({ username: userName, token });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json({ error });
  }
};

export default loginStudent;
