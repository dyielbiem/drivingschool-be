import { PutCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";
import { hashPassWord } from "../../utils/index.js";

const addAdmin = async (req, res) => {
  try {
    const {
      drivingSchoolID,
      superAdminUserName,
      limitedAccess = false,
      adminUserName,
      adminDisplayName,
      passWord,
      confirmPassWord
    } = req.body;

    if (
      !drivingSchoolID ||
      !adminUserName ||
      !passWord ||
      !confirmPassWord ||
      !adminDisplayName
    )
      throw Error("All required fields must filled");

    if (limitedAccess && typeof limitedAccess !== "boolean")
      throw Error("Limited accesss must be a boolean");

    if (passWord !== confirmPassWord) throw Error("Passwords do not match");

    const hashedPassWord = await hashPassWord(passWord);

    const command = new PutCommand({
      TableName: process.env.ADMIN_TABLE,
      Item: {
        adminUserName,
        passWord: hashedPassWord,
        drivingSchoolID,
        adminDisplayName,
        limitedAccess,
        addedBy: superAdminUserName,
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
