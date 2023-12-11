import bcrypt from "bcryptjs";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to sign up a super admin
---- /api/superadmins/signup (POST)
*/
const signUpSuperAdmin = async (req, res) => {
  const { username, password, confirmPassword, secret } = req.body;
  try {
    if (!username || !password || !confirmPassword || !secret)
      throw Error("All required fields must be filled");
    if (process.env.SUPER_ADMIN_SECRET !== secret)
      return res.status(401).json({ error: "Unauthorized" });

    if (password !== confirmPassword) throw Error("Passwords do not match");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const putCommand = new PutCommand({
      TableName: process.env.SUPER_ADMIN_TABLE,
      Item: {
        username,
        password: hashedPassword,
      },
      ConditionExpression: "attribute_not_exists(username)",
    });

    const result = await dynamoClient.send(putCommand);

    res.status(200).json(result);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Username is already in use" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json({ error });
  }
};

export default signUpSuperAdmin;
