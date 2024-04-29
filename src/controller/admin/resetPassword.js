import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import dynamoClient from "../../db_connection/dbCLient.js";
import { decrypt } from "../../utils/crypto.js";

/*
---- Controller to reset password
---- /api/admin/reset-password (PATCH)
*/
const resetPassword = async (req, res) => {
  try {
    const { resetPasswordToken, passWord, confirmPassWord } = req.body;

    if (!resetPasswordToken || !passWord || !confirmPassWord)
      throw Error("All required field must be provided");

    if (passWord !== confirmPassWord) throw Error("Passwords do not match");

    let payload;
    try {
      const payloadString = decrypt(resetPasswordToken);
      payload = JSON.parse(payloadString);
    } catch {
      throw Error("Invalid reset password token");
    }

    const { adminUserName, resetExpiration } = payload;

    if (!resetExpiration || !adminUserName)
      throw Error("Invalid reset password token");

    if (new Date() > new Date(resetExpiration))
      throw Error("Reset password token has expired");

    const salt = await bcrypt.genSalt(10);
    const hashedPassWord = await bcrypt.hash(passWord, salt);

    const command = new UpdateCommand({
      TableName: process.env.ADMIN_TABLE,
      Key: {
        adminUserName
      },
      UpdateExpression: "SET passWord = :hashedPassWord",
      ExpressionAttributeValues: {
        ":hashedPassWord": hashedPassWord
      },
      ConditionExpression: "attribute_exists(adminUserName)"
    });

    await dynamoClient.send(command);

    res.status(200).json({ message: "Password has been reset" });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Admin does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default resetPassword;
