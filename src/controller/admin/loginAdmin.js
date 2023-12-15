import { GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/*
---- Controller to log in an admin
---- /api/admin/login (POST)
*/
const loginAdmin = async (req, res) => {
  try {
    const { userName, passWord, drivingSchoolName } = req.body;
    if (!userName || !passWord || !drivingSchoolName)
      throw Error("All required fields must be filled");

    const command = new GetCommand({
      TableName: process.env.ADMIN_TABLE,
      Key: {
        drivingSchoolName,
        adminUserName: userName,
      },
    });

    const { Item } = await dynamoClient.send(command);
    if (!Item) throw Error("Username or password is incorrect");

    const isPasswordCorrect = await bcrypt.compare(passWord, Item.passWord);

    if (!isPasswordCorrect) throw Error("Username or password is incorrect");

    const token = jwt.sign(
      { adminUserName: userName, drivingSchoolName },
      process.env.ADMIN_JWT_SECRET,
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

export default loginAdmin;
