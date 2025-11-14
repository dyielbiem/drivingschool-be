import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";
import { hashPassWord } from "../../utils/index.js";

/*
---- Controller to reset admin password
---- /api/superadmin/admin (PATCH)
*/
const resetAdminPassword = async (req, res) => {
  try {
    const { adminUserName, passWord, confirmPassWord } = req.body;

    if (!adminUserName || !passWord || !confirmPassWord)
      throw Error("All required fields must filled");

    if (passWord !== confirmPassWord) throw Error("Passwords do not match");

    const hashedPassWord = await hashPassWord(passWord);

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

    res.status(200).json({
      message: `Password for ${adminUserName} has been reset`
    });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Admin does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json({ error });
  }
};

export default resetAdminPassword;
