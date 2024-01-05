import { GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/generateToken.js";

/*
---- Controller to log in an admin
---- /api/admin/login (POST)
*/
const loginAdmin = async (req, res) => {
  try {
    const { userName, passWord, drivingSchoolID } = req.body;
    if (!userName || !passWord || !drivingSchoolID)
      throw Error("All required fields must be filled");

    const command = new GetCommand({
      TableName: process.env.ADMIN_TABLE,
      Key: {
        drivingSchoolID,
        adminUserName: userName,
      },
    });

    const { Item } = await dynamoClient.send(command);
    if (!Item) throw Error("Username or password is incorrect");

    const isPasswordCorrect = await bcrypt.compare(passWord, Item.passWord);

    if (!isPasswordCorrect) throw Error("Username or password is incorrect");

    const jwtPayload = { adminUserName: userName, drivingSchoolID };
    const accessToken = generateAccessToken(
      jwtPayload,
      process.env.ADMIN_JWT_SECRET
    );

    const refreshToken = generateRefreshToken(jwtPayload);

    res.status(200).json({ username: userName, accessToken, refreshToken });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json({ error });
  }
};

export default loginAdmin;
