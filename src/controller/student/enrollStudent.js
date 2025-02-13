import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import payment from "../../utils/payment.js";
import dynamoClient from "../../db_connection/dbCLient.js";
import invokeFunction from "../../lambda_invoke_connection/invokeFunction.js";

const getFinalChargeAmount = (couponItem, chargeAmount) => {
  if (!couponItem?.couponAmount) return chargeAmount;

  if (couponItem?.couponAmount >= chargeAmount) return 0;

  return chargeAmount - couponItem.couponAmount;
};

/*
---- Controller to enroll a student
---- /api/student/enroll (POST)
*/
const enrollStudent = async (req, res) => {
  try {
    const {
      drivingSchoolCredentials,
      accountInformation,
      mailingInformation,
      billingInformation,
      cardInformation,
      courseID,
      couponCode
    } = req.body;

    if (
      !drivingSchoolCredentials?.paymentLogInKey ||
      !drivingSchoolCredentials?.paymentTransactionKey ||
      !drivingSchoolCredentials?.drivingSchoolID
    )
      throw Error("Driving school credentials must be complete");

    if (
      !accountInformation?.userName ||
      !accountInformation?.passWord ||
      !accountInformation?.confirmPassWord ||
      !accountInformation?.birthDate
    )
      throw Error("Account information must be complete");

    if (
      !mailingInformation?.firstName ||
      !mailingInformation?.lastName ||
      !mailingInformation?.address ||
      !mailingInformation?.city ||
      !mailingInformation?.state ||
      !mailingInformation?.zip ||
      !mailingInformation?.country ||
      !mailingInformation?.email ||
      !mailingInformation?.phoneNumber
    )
      throw Error("Mailing information must be complete");

    if (
      !billingInformation?.firstName ||
      !billingInformation?.lastName ||
      !billingInformation?.address ||
      !billingInformation?.city ||
      !billingInformation?.state ||
      !billingInformation?.zip ||
      !billingInformation?.country ||
      !billingInformation?.email ||
      !billingInformation?.phoneNumber
    )
      throw Error("Billing information must be complete");

    if (
      !cardInformation?.cardNumber ||
      !cardInformation?.cardCode ||
      !cardInformation?.cardExpiration
    )
      throw Error("Card information must be complete");

    if (Number.isNaN(new Date(accountInformation.birthDate).getTime()))
      throw Error("Birth date must be a valid date string format");

    if (!courseID) throw Error("Course ID must be provided");

    if (accountInformation?.passWord !== accountInformation?.confirmPassWord)
      throw Error("Passwords do not match");

    // Check if driving school is existing
    const drivingSchoolGetCommand = new GetCommand({
      TableName: process.env.DRIVING_SCHOOL_TABLE,
      Key: {
        drivingSchoolID: drivingSchoolCredentials.drivingSchoolID
      }
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
        drivingSchoolID: drivingSchoolCredentials.drivingSchoolID,
        studentUserName: accountInformation.userName
      }
    });

    const studentResult = await dynamoClient.send(studentGetCommand);

    if (studentResult.Item) throw Error("Username is already in use");

    // Check if course ID is valid
    const courseCommand = new GetCommand({
      TableName: process.env.COURSE_TABLE,
      Key: {
        courseID: courseID
      },
      ProjectionExpression: "courseID, courseType, courseName, coursePrice"
    });

    const { Item: courseResult } = await dynamoClient.send(courseCommand);
    if (!courseResult) throw Error("Invalid course ID");

    // If course is valid, get the active section
    const sectionCommand = new QueryCommand({
      TableName: process.env.SECTION_TABLE,
      IndexName: "DrivingSchoolIndex",
      KeyConditionExpression: "drivingSchoolID = :drivingSchoolIDValue",
      FilterExpression: "isActive  = :isActiveValue",
      ExpressionAttributeValues: {
        ":drivingSchoolIDValue": drivingSchoolCredentials.drivingSchoolID,
        ":isActiveValue": true
      },
      ProjectionExpression: "sectionID"
    });

    const { Items: sectionResult } = await dynamoClient.send(sectionCommand);
    if (sectionResult.length === 0)
      throw Error("The driving school has no active section");

    // Check if the provided coupon is valid
    let couponItem;
    if (couponCode) {
      const couponCommand = new GetCommand({
        TableName: process.env.COUPON_TABLE,
        Key: {
          drivingSchoolID: drivingSchoolCredentials.drivingSchoolID,
          couponCode
        }
      });

      const { Item } = await dynamoClient.send(couponCommand);

      if (!Item) throw Error("Invalid coupon code");

      const expiryDate = new Date(Item.toDate);
      expiryDate.setDate(expiryDate.getDate() + 1);

      if (!Item.isActive || expiryDate < new Date())
        throw Error("Invalid coupon code");

      couponItem = Item;
    }

    // Get the final charge amount
    const finalChargeAmount = parseFloat(
      getFinalChargeAmount(couponItem, courseResult.coursePrice).toFixed(2)
    );

    if (finalChargeAmount === 0)
      throw Error("The coupon code is not applicable for this transaction");

    const paymentID = nanoid(20);
    const salt = await bcrypt.genSalt(10);
    const hashedPassWord = await bcrypt.hash(accountInformation.passWord, salt);

    // Create a request to Authorize.net API Gateway
    // to charge the credit card
    const respond = await payment(
      drivingSchoolCredentials,
      accountInformation,
      mailingInformation,
      billingInformation,
      cardInformation,
      courseID,
      courseResult.courseName,
      finalChargeAmount,
      paymentID
    );

    if (respond.messages.resultCode !== "Ok")
      return res.status(400).json({
        error:
          (respond.transactionResponse?.errors &&
            respond.transactionResponse.errors[0].errorText) ||
          (respond.messages?.message && respond.messages?.message[0].text) ||
          "An error occured in payment transaction"
      });

    if (respond.transactionResponse.responseCode !== "1")
      return res.status(400).json({
        error: "The credit card was declined"
      });

    // Add the student to database upon the
    // successful payment transaction
    const putCommand = new PutCommand({
      TableName: process.env.STUDENT_TABLE,
      Item: {
        drivingSchoolID: drivingSchoolCredentials.drivingSchoolID,
        studentUserName: accountInformation.userName,
        passWord: hashedPassWord,
        courseID: courseID,
        sectionID: sectionResult[0]?.sectionID,
        usedCouponCode: couponCode,
        paymentID: respond.refId,
        transactionID: respond.transactionResponse.transId,
        accountNumber: respond.transactionResponse.accountNumber,
        accountType: respond.transactionResponse.accountType,
        billingFirstName: billingInformation.firstName,
        billingLastName: billingInformation.lastName,
        billingCompany: billingInformation.company || "Not applicable",
        billingAddress: billingInformation.address,
        billingCity: billingInformation.city,
        billingState: billingInformation.state,
        billingZip: billingInformation.zip,
        billingCountry: billingInformation.country,
        billingEmail: billingInformation.email,
        billingPhoneNumber: billingInformation.phoneNumber,
        mailingFirstName: mailingInformation.firstName,
        mailingLastName: mailingInformation.lastName,
        mailingCompany: mailingInformation.company || "Not applicable",
        mailingAddress: mailingInformation.address,
        mailingCity: mailingInformation.city,
        mailingState: mailingInformation.state,
        mailingZip: mailingInformation.zip,
        mailingCountry: mailingInformation.country,
        mailingEmail: mailingInformation.email,
        mailingPhoneNumber: mailingInformation.phoneNumber,
        highSchool: accountInformation.highSchool || "Not applicable",
        birthDate: accountInformation.birthDate,
        enrollmentDate: Date(),
        paidAmount: finalChargeAmount,
        isActive: true,
        courseType: courseResult.courseType
      }
    });

    await dynamoClient.send(putCommand);

    const emailSubject =
      drivingSchoolResult.Item.emailSubject ||
      `Welcome to ${drivingSchoolResult.Item.drivingSchoolName}`;
    let emailBody =
      drivingSchoolResult.Item.emailBody ||
      `Hello ${accountInformation.userName}, welcome aboard to ${drivingSchoolResult.Item.drivingSchoolName}! Get ready to hit the road with confidence.`;

    const userNameTemplatePattern = /\{ username \}/g;
    const passWordTemplatePattern = /\{ password \}/g;

    emailBody = emailBody.replace(
      userNameTemplatePattern,
      accountInformation.userName
    );

    emailBody = emailBody.replace(
      passWordTemplatePattern,
      accountInformation.passWord
    );

    const invokeFunctionArgs = {
      invokePath: "/api/student/send-email",
      headers: {
        "x-api-key": process.env.API_KEY
      },
      method: "POST",
      body: {
        emailReceiver: mailingInformation.email,
        emailSubject: emailSubject,
        emailBody: emailBody
      }
    };

    await invokeFunction(invokeFunctionArgs);

    res.status(200).json({
      drivingSchoolID: drivingSchoolCredentials.drivingSchoolID,
      userName: accountInformation.userName,
      paymentID: respond.refId,
      transactionID: respond.transactionResponse.transId,
      paidAmount: finalChargeAmount,
      sectionID: sectionResult[0]?.sectionID,
      message: "The enrollment process was successful",
      courseType: courseResult.courseType
    });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default enrollStudent;
