import { GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";
import { encrypt } from "../../utils/crypto.js";
import invokeFunction from "../../lambda_invoke_connection/invokeFunction.js";

/*
---- Controller to get code when reset password
---- /api/admin/reset-password/code (GET)
*/
const getResetPasswordCode = async (req, res) => {
  try {
    const { adminUserName } = req.query;

    if (!adminUserName) throw Error("Username must be provided");

    const command = new GetCommand({
      TableName: process.env.ADMIN_TABLE,
      Key: {
        adminUserName
      }
    });

    const { Item: admin } = await dynamoClient.send(command);
    if (!admin) throw Error("Admin does not exist");

    const verifyExpiration = new Date();
    verifyExpiration.setMinutes(verifyExpiration.getMinutes() + 2);
    const verificationCode = String(
      Math.floor(Math.random() * 100000)
    ).padStart(6, "0");

    const emailBody = `<p style="font-size: 1rem">Hi ${adminUserName},</p>
    <p style="margin: 0; font-size: 1rem">
      We've received a request to reset your password.
    </p>
    <p style="margin: 0; font-size: 1rem">
      Please provide the following code to continue:
    </p>
    <p>
      <strong style="font-size: 2rem">${verificationCode}</strong>
    </p>`;

    const getEmailCommand = new GetCommand({
      TableName: process.env.DRIVING_SCHOOL_TABLE,
      Key: {
        drivingSchoolID: admin.drivingSchoolID
      },
      ProjectionExpression: "email"
    });

    const { Item: drivingSchool } = await dynamoClient.send(getEmailCommand);
    if (!drivingSchool) throw Error("Driving school does not exist");

    const invokeFunctionArgs = {
      invokePath: "/api/admin/send-email",
      headers: {
        "x-api-key": process.env.API_KEY
      },
      method: "POST",
      body: {
        emailReceiver: drivingSchool.email,
        emailSubject: "Your reset password verification code",
        emailBody
      }
    };

    await invokeFunction(invokeFunctionArgs);

    const payload = JSON.stringify({
      adminUserName,
      verifyExpiration,
      verificationCode
    });
    const verificationToken = encrypt(payload);

    res.status(200).json({ verificationToken });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default getResetPasswordCode;
