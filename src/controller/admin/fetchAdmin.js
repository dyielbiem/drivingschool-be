import { GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch the admin information
---- /api/admin (GET)
*/
const fetchAdmin = async (req, res) => {
  try {
    const { adminUserName } = req.body;

    const command = new GetCommand({
      TableName: process.env.ADMIN_TABLE,
      Key: {
        adminUserName
      }
    });

    const { Item: admin } = await dynamoClient.send(command);
    if (!admin) throw Error("Admin does not exist");

    res.status(200).json(admin);
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchAdmin;
