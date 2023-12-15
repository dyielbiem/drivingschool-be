import dynamoClient from "../../db_connection/dbCLient.js";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";

/*
---- Controller to delete an existing admin role
---- /api/superadmin/create-admin (POST)
*/
const deleteAdmin = async (req, res) => {
  try {
    const { adminUserName } = req.body;

    if (!adminUserName) throw Error("Admin username is required");

    const command = new DeleteCommand({
      TableName: process.env.ADMIN_TABLE,
      Key: {
        UserName: adminUserName,
      },
      ConditionExpression: "attribute_exists(username)",
    });

    const result = await dynamoClient.send(command);

    res.status(200).json(result);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Admin does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json({ error });
  }
};

export default deleteAdmin;
