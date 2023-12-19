import bcrypt from "bcryptjs";
import dynamoClient from "../../db_connection/dbCLient.js";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { encrypt } from "../../utils/crypto.js";

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
      passWord,
      confirmPassWord,
      superAdmin,
    } = req.body;
    if (
      !paymentLogInKey ||
      !paymentTransactionKey ||
      !drivingSchoolName ||
      !adminUserName ||
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

    const command = new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: process.env.DRIVING_SCHOOL_TABLE,
            Item: {
              drivingSchoolName: drivingSchoolName,
              address,
              city,
              state,
              zip,
              country,
              paymentLogInKey: encryptedPaymentLogInKey,
              paymentTransactionKey: encryptedTransactionKey,
            },
            ConditionExpression: "attribute_not_exists(drivingSchoolName)",
          },
        },
        {
          Put: {
            TableName: process.env.ADMIN_TABLE,
            Item: {
              drivingSchoolName: drivingSchoolName,
              adminUserName,
              passWord: hashedPassWord,
              addedBy: superAdmin,
              dateAdded: Date(),
            },
            ConditionExpression:
              "attribute_not_exists(drivingSchoolName) AND attribute_not_exists(adminUserName)",
          },
        },
      ],
    });

    const result = await dynamoClient.send(command);

    res.status(200).json(result);
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
