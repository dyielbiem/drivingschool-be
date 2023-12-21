import payment from "../../utils/payment.js";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to enroll a student
---- /api/student/enroll (POST)
*/
const enrollStudent = async (req, res) => {
  try {
    const {
      paymentLogInKey,
      paymentTransactionKey,
      userName,
      passWord,
      confirmPassWord,
      drivingSchoolID,
      firstName,
      lastName,
      company,
      address,
      city,
      state,
      zip,
      country,
      email,
      cardNumber,
      cardCode,
      cardExpiration,
      courseName,
      chargeAmount,
      courseID,
    } = req.body;

    if (
      !paymentLogInKey ||
      !paymentTransactionKey ||
      !userName ||
      !passWord ||
      !confirmPassWord ||
      !firstName ||
      !lastName ||
      !company ||
      !address ||
      !city ||
      !state ||
      !zip ||
      !country ||
      !email ||
      !cardNumber ||
      !cardCode ||
      !cardExpiration ||
      !drivingSchoolID ||
      !courseName ||
      !chargeAmount ||
      !courseID
    )
      throw Error("All fields must be filled");

    if (passWord !== confirmPassWord) throw Error("Passwords do not match");

    // Check if driving school is existing
    const drivingSchoolGetCommand = new GetCommand({
      TableName: process.env.DRIVING_SCHOOL_TABLE,
      Key: {
        drivingSchoolID,
      },
    });

    const drivingSchoolResult = await dynamoClient.send(
      drivingSchoolGetCommand
    );

    if (!drivingSchoolResult.Item)
      throw Error("The driving school does not exist");

    // Check if username is available
    const studentGetCommand = new GetCommand({
      TableName: process.env.STUDENT_TABLE,
      Key: {
        drivingSchoolID,
        studentUserName: userName,
      },
    });

    const studentResult = await dynamoClient.send(studentGetCommand);

    if (studentResult.Item) throw Error("Username is already in use");

    const paymentID = nanoid(20);

    const salt = await bcrypt.genSalt(10);
    const hashedPassWord = await bcrypt.hash(passWord, salt);

    const merchantInfo = {
      loginKey: paymentLogInKey,
      transactionKey: paymentTransactionKey,
      drivingSchoolID,
    };

    const studentInfo = {
      userName,
      firstName,
      lastName,
      company,
      address,
      city,
      state,
      zip,
      country,
      email,
    };

    const cardInfo = {
      number: cardNumber,
      code: cardCode,
      expiration: cardExpiration,
    };

    // Create a request to Authorize.net API Gateway
    // to charge the credit card
    const respond = await payment(
      merchantInfo,
      paymentID,
      chargeAmount,
      studentInfo,
      cardInfo,
      courseName
    );

    if (respond.messages.resultCode !== "Ok")
      return res.status(400).json(respond);

    // Add the student to database upon the
    // successful payment transaction
    const putCommand = new PutCommand({
      TableName: process.env.STUDENT_TABLE,
      Item: {
        drivingSchoolID,
        studentUserName: userName,
        passWord: hashedPassWord,
        courseID,
        firstName,
        lastName,
        company,
        address,
        city,
        state,
        zip,
        country,
        email,
        paymentID: respond.refId,
      },
    });

    await dynamoClient.send(putCommand);

    res.status(200).json({
      drivingSchoolID,
      userName,
      paymentID: respond.refId,
    });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default enrollStudent;
