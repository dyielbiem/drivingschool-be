import bcrypt from "bcryptjs";
import dynamoClient from "../../db_connection/dbCLient.js";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

/*
---- Controller to create new admin role
---- /api/superadmins/create-admin (POST)
*/
export const createAdmin = async (req, res) => {
  try {
    const { superAdmin, adminUserName, password, confirmPassword } = req.body;
    if (!adminUserName || !password || !confirmPassword)
      throw Error("All required fields must be filled");
    if (password !== confirmPassword) throw Error("Passwords do not matched");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const command = new PutCommand({
      TableName: process.env.ADMIN_TABLE,
      Item: {
        username: adminUserName,
        password: hashedPassword,
        addedBy: superAdmin,
        dateAdded: Date(),
      },
      ConditionExpression: "attribute_not_exists(username)",
    });

    const result = await dynamoClient.send(command);

    res.status(200).json(result);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Admin username already in use" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json({ error });
  }
};

export default createAdmin;
