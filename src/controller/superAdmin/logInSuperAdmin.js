import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dynamoClient from "../../db_connection/dbCLient.js";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

/*
---- Controller to log in a super admin
---- /api/superadmin/login (POST)
*/
const loginSuperAdmin = async (req, res) => {
  try {
    const { userName, passWord } = req.body;
    if (!userName || !passWord)
      throw Error("All required fields must be filled");

    const command = new GetCommand({
      TableName: process.env.SUPER_ADMIN_TABLE,
      Key: {
        userName,
      },
    });

    // Check if super admin is existing
    const { Item } = await dynamoClient.send(command);
    if (!Item) throw Error("Username or password is incorrect");

    // Check if inputted password is correct
    const isPassowrdCorrect = await bcrypt.compare(passWord, Item.passWord);
    if (!isPassowrdCorrect) throw Error("Username or password is incorrect");

    // If super admin credentials are correct, generate a token
    const token = jwt.sign({ userName }, process.env.SUPER_ADMIN_JWT_SECRET, {
      expiresIn: "3h",
    });

    res.status(200).json({ username: Item.userName, token });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json({ error });
  }
};

export default loginSuperAdmin;
