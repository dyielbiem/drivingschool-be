import { PutCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to add another admin of a driving school
---- /api/admin (POST)
*/
const addAdmin = async (req, res) => {
  try {
    const {
      drivingSchoolID,
      adminUserName,
      limitedAccess,
      passWord,
      confirmPassWord,
      newAdminUserName,
      adminDisplayName
    } = req.body;

    if (!newAdminUserName || !passWord || !confirmPassWord || !adminDisplayName)
      throw Error("All required fields must filled");

    if (limitedAccess && typeof limitedAccess !== "boolean")
      throw Error("Limited accesss must be a boolean");

    if (passWord !== confirmPassWord) throw Error("Passwords do not match");

    const salt = await bcrypt.genSalt(10);
    const hashedPassWord = await bcrypt.hash(passWord, salt);

    const command = new PutCommand({
      TableName: process.env.ADMIN_TABLE,
      Item: {
        adminUserName: newAdminUserName,
        passWord: hashedPassWord,
        drivingSchoolID,
        adminDisplayName,
        limitedAccess,
        addedBy: adminUserName,
        dateAdded: Date()
      },
      ConditionExpression: "attribute_not_exists(adminUserName)"
    });

    await dynamoClient.send(command);

    res.status(200).json({ message: "New admin is added" });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Username is already taken" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default addAdmin;
