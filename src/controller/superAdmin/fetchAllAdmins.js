import dynamoClient from "../../db_connection/dbCLient.js";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

/*
---- Controller to fetch all the super admin
---- /api/superadmins/ (GET)
*/
const fetchAllAdmins = async (req, res) => {
  try {
    const command = new ScanCommand({
      TableName: process.env.ADMIN_TABLE,
    });

    const result = await dynamoClient.send(command);

    res.status(200).json(result.Items);
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json({ error });
  }
};

export default fetchAllAdmins;
