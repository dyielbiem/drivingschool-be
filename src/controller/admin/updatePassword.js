import bcrypt from "bcryptjs";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to update admin password
---- /api/admin/password/
*/
const updatePassword = async (req, res) => {
  try {
    const { adminUserName, oldPassword, newPassword, confirmPassword } =
      req.body;

    if (!oldPassword || !newPassword || !confirmPassword)
      throw Error("All required fields must be provided");

    if (newPassword !== confirmPassword) throw Error("Passwords do not match");

    const getAdminCommand = new GetCommand({
      TableName: process.env.ADMIN_TABLE,
      Key: {
        adminUserName
      }
    });

    const { Item: admin } = await dynamoClient.send(getAdminCommand);
    if (!admin) throw Error("Admin does not exist");

    const isPasswordCorrect = await bcrypt.compare(oldPassword, admin.passWord);
    if (!isPasswordCorrect) throw Error("Old password is incorrect");

    const salt = await bcrypt.genSalt(10);
    const hashedPassWord = await bcrypt.hash(newPassword, salt);

    const updatePasswordCommand = new UpdateCommand({
      TableName: process.env.ADMIN_TABLE,
      Key: {
        adminUserName
      },
      UpdateExpression: "SET passWord = :passWord",
      ExpressionAttributeValues: {
        ":passWord": hashedPassWord
      },
      ConditionExpression: "attribute_exists(adminUserName)"
    });

    await dynamoClient.send(updatePasswordCommand);

    res.status(200).json({ message: "Password has been changed successfully" });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Admin does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updatePassword;
