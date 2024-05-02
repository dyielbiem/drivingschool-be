import { GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";
import { encrypt } from "../../utils/crypto.js";
import invokeFunction from "../../lambda_invoke_connection/invokeFunction.js";

/*
---- Controller to get code when reset password
---- /api/student/reset-password/code (GET)
*/
const getResetPasswordCode = async (req, res) => {
  try {
    const { studentUserName, drivingSchoolID } = req.query;

    if (!studentUserName || !drivingSchoolID)
      throw Error("All required fields must be provided");

    const command = new GetCommand({
      TableName: process.env.STUDENT_TABLE,
      Key: {
        studentUserName,
        drivingSchoolID
      }
    });

    const { Item: student } = await dynamoClient.send(command);
    if (!student) throw Error("Student does not exist");

    const verifyExpiration = new Date();
    verifyExpiration.setMinutes(verifyExpiration.getMinutes() + 2);
    const verificationCode = String(
      Math.floor(Math.random() * 100000)
    ).padStart(6, "0");

    const emailBody = `<p style="font-size: 1rem">Hi ${studentUserName},</p>
    <p style="margin: 0; font-size: 1rem">
      We've received a request to reset your password.
    </p>
    <p style="margin: 0; font-size: 1rem">
      Please provide the following code to continue:
    </p>
    <p>
      <strong style="font-size: 2rem">${verificationCode}</strong>
    </p>`;

    const invokeFunctionArgs = {
      invokePath: "/api/student/send-email",
      headers: {
        "x-api-key": process.env.API_KEY
      },
      method: "POST",
      body: {
        emailReceiver: student.mailingEmail,
        emailSubject: "Your reset password verification code",
        emailBody
      }
    };

    await invokeFunction(invokeFunctionArgs);

    const payload = JSON.stringify({
      studentUserName,
      drivingSchoolID,
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
