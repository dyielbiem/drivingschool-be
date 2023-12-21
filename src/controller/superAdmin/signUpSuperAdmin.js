import bcrypt from "bcryptjs";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to sign up a super admin
---- /api/superadmin/signup (POST)
*/
const signUpSuperAdmin = async (req, res) => {
  const { userName, displayName, passWord, confirmPassWord } = req.body;
  try {
    if (!userName || !passWord || !confirmPassWord || !displayName)
      throw Error("All required fields must be filled");

    if (passWord !== confirmPassWord) throw Error("Passwords do not match");

    const salt = await bcrypt.genSalt(10);
    const hashedPassWord = await bcrypt.hash(passWord, salt);

    const putCommand = new PutCommand({
      TableName: process.env.SUPER_ADMIN_TABLE,
      Item: {
        superAdminUserName: userName,
        displayName,
        passWord: hashedPassWord,
      },
      ConditionExpression: "attribute_not_exists(superAdminUserName)",
    });

    await dynamoClient.send(putCommand);

    res.status(200).json({ userName, displayName });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Username is already in use" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json({ error });
  }
};

export default signUpSuperAdmin;
