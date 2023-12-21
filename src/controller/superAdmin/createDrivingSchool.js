import bcrypt from "bcryptjs";
import dynamoClient from "../../db_connection/dbCLient.js";
import { TransactWriteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { encrypt } from "../../utils/crypto.js";
import { nanoid } from "nanoid";

/*
---- Controller to create new admin role
---- /api/superadmin/create-admin (POST)
*/
export const createDrivingSchool = async (req, res) => {
  try {
    const {
      paymentLogInKey,
      paymentTransactionKey,
      drivingSchoolName,
      address,
      city,
      state,
      zip,
      country,
      adminUserName,
      adminDisplayName,
      passWord,
      confirmPassWord,
      superAdmin,
    } = req.body;
    if (
      !paymentLogInKey ||
      !paymentTransactionKey ||
      !drivingSchoolName ||
      !adminUserName ||
      !adminDisplayName ||
      !passWord ||
      !confirmPassWord ||
      !address ||
      !city ||
      !state ||
      !zip ||
      !country
    )
      throw Error("All required fields must be filled");
    if (passWord !== confirmPassWord) throw Error("Passwords do not matched");

    const salt = await bcrypt.genSalt(10);
    const hashedPassWord = await bcrypt.hash(passWord, salt);

    const encryptedPaymentLogInKey = encrypt(paymentLogInKey);
    const encryptedTransactionKey = encrypt(paymentTransactionKey);

    // Check if driving school is already existing
    const checkDrivingSchoolCommand = new QueryCommand({
      TableName: process.env.DRIVING_SCHOOL_TABLE,
      IndexName: "DrivingSchoolNameIndex",
      KeyConditionExpression: "drivingSchoolName = :drivingSchoolNameValue",
      ExpressionAttributeValues: {
        ":drivingSchoolNameValue": drivingSchoolName,
      },
    });

    const { Items } = await dynamoClient.send(checkDrivingSchoolCommand);
    if (Items.length > 0) throw Error("The driving school already exists");

    // If the driving school does not exist,
    // add it to the database and create the admin
    const drivingSchoolID = nanoid();
    const transactWriteCommand = new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: process.env.DRIVING_SCHOOL_TABLE,
            Item: {
              drivingSchoolID,
              drivingSchoolName,
              address,
              city,
              state,
              zip,
              country,
              paymentLogInKey: encryptedPaymentLogInKey,
              paymentTransactionKey: encryptedTransactionKey,
            },
            ConditionExpression: "attribute_not_exists(drivingSchoolID)",
          },
        },
        {
          Put: {
            TableName: process.env.ADMIN_TABLE,
            Item: {
              drivingSchoolID,
              adminUserName,
              adminDisplayName,
              passWord: hashedPassWord,
              addedBy: superAdmin,
              dateAdded: Date(),
            },
            ConditionExpression:
              "attribute_not_exists(drivingSchoolID) AND attribute_not_exists(adminUserName)",
          },
        },
      ],
    });

    await dynamoClient.send(transactWriteCommand);
    res.status(200).json({
      drivingSchoolID,
      drivingSchoolName,
      adminUserName,
      adminDisplayName,
    });
  } catch (error) {
    if (String(error.message).includes("Transaction cancelled"))
      return res
        .status(400)
        .json({ error: "The driving school already exists" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json({ error });
  }
};

export default createDrivingSchool;
