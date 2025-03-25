import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

import payment from "../../utils/payment.js";
import dynamoClient from "../../db_connection/dbCLient.js";
import invokeFunction from "../../lambda_invoke_connection/invokeFunction.js";
import { getDrivingSchool } from "../../utils/dbUtils/drivingSchool.js";
import { getStudent } from "../../utils/dbUtils/student.js";
import { getCourse } from "../../utils/dbUtils/course.js";
import { getActiveSection } from "../../utils/dbUtils/section.js";
import { getCoupon } from "../../utils/dbUtils/coupon.js";

const getFinalChargeAmount = (couponItem, chargeAmount) => {
  const finalChargeAmount = !couponItem?.couponAmount
    ? chargeAmount
    : couponItem?.couponAmount >= chargeAmount
      ? 0
      : chargeAmount - couponItem.couponAmount;

  return finalChargeAmount;
};

const getEmailSubject = (drivingSchool) =>
  drivingSchool.emailSubject || `Welcome to ${drivingSchool.drivingSchoolName}`;

const getEmailBody = (drivingSchool, accountInformation) => {
  const { userName, passWord } = accountInformation;
  const emailBody =
    drivingSchool.emailBody ||
    `
      Hello ${accountInformation.userName}, 
      welcome aboard to ${drivingSchool.drivingSchoolName}!
      Get ready to hit the road with confidence.
    `;

  return emailBody
    .replace(/\{ username \}/g, userName)
    .replace(/\{ password \}/g, passWord);
};

const validateCoupon = async (couponCode, drivingSchoolID) => {
  if (!couponCode) {
    return [null, true];
  }

  const { Item: coupon } = await getCoupon(couponCode, drivingSchoolID);

  if (!coupon) {
    return [coupon, false];
  }

  const expiryDate = new Date(coupon.toDate);
  expiryDate.setDate(expiryDate.getDate() + 1);

  const isValid = coupon.isActive && expiryDate > new Date();

  return [coupon, isValid];
};

/*
---- Controller to enroll a student
---- /api/student/enroll (POST)
*/
const enrollStudent = async (req, res) => {
  try {
    const {
      drivingSchoolCredentials,
      accountInformation = {},
      mailingInformation = {},
      billingInformation = {},
      cardInformation = {},
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

    if (Number.isNaN(new Date(accountInformation.birthDate).getTime()))
      throw Error("Birth date must be a valid date string format");

    if (!courseID) throw Error("Course ID must be provided");

    if (accountInformation?.passWord !== accountInformation?.confirmPassWord)
      throw Error("Passwords do not match");

    // Validate Driving School ID
    const { Item: drivingSchool } = await getDrivingSchool(
      drivingSchoolCredentials.drivingSchoolID
    );
    if (!drivingSchool) throw Error("The driving school does not exist");

    // Check if student username is available
    const { Item: student } = await getStudent(
      drivingSchoolCredentials.drivingSchoolID,
      accountInformation.userName
    );
    if (student) throw Error("Username is already in use");

    // Check if course ID is valid
    const { Item: courseResult } = await getCourse(courseID);
    if (!courseResult) throw Error("Invalid course ID");

    // If course is valid, get the active section
    const activeSection = await getActiveSection(
      drivingSchoolCredentials.drivingSchoolID
    );
    if (!activeSection) throw Error("The driving school has no active section");

    // Check if the provided coupon is valid
    const [couponItem, isCouponValid] = await validateCoupon(
      couponCode,
      drivingSchoolCredentials.drivingSchoolID
    );
    if (!isCouponValid) {
      throw Error("Invalid coupon code");
    }

    // Get the final charge amount
    const paymentID = nanoid(20);
    const salt = await bcrypt.genSalt(10);
    const hashedPassWord = await bcrypt.hash(accountInformation.passWord, salt);
    const finalChargeAmount = getFinalChargeAmount(
      couponItem,
      courseResult.coursePrice
    );

    let respond = {
      refId: "",
      transactionResponse: {
        transId: "",
        accountNumber: "",
        accountType: ""
      }
    };

    /* 
      If final charge amount is more than zero,
      Create a request to Authorize.net API Gateway
      to charge the credit card 
    */
    if (finalChargeAmount > 0) {
      const { cardNumber, cardCode, cardExpiration } = cardInformation || {};
      const {
        firstName,
        lastName,
        address,
        city,
        state,
        zip,
        country,
        email,
        phoneNumber
      } = billingInformation || {};

      if (
        !firstName ||
        !lastName ||
        !address ||
        !city ||
        !state ||
        !zip ||
        !country ||
        !email ||
        !phoneNumber
      ) {
        throw Error("Billing information must be complete");
      }

      if (!cardNumber || !cardCode || !cardExpiration) {
        throw Error("Card information must be complete");
      }

      respond = await payment(
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

      const { resultCode, message } = respond.messages || {};
      const { errors, responseCode } = respond.transactionResponse || {};

      if (resultCode !== "Ok")
        return res.status(400).json({
          error:
            errors?.[0]?.errorText ||
            message?.[0]?.text ||
            "An error occured in payment transaction"
        });

      if (responseCode !== "1")
        return res.status(400).json({
          error: errors?.[0]?.errorText || "The credit card was declined"
        });
    }

    // Add the student to database
    const putCommand = new PutCommand({
      TableName: process.env.STUDENT_TABLE,
      Item: {
        drivingSchoolID: drivingSchoolCredentials.drivingSchoolID,
        studentUserName: accountInformation.userName,
        passWord: hashedPassWord,
        courseID: courseID,
        sectionID: activeSection.sectionID,
        usedCouponCode: couponCode,
        paymentID: respond.refId,
        transactionID: respond.transactionResponse.transId,
        accountNumber: respond.transactionResponse.accountNumber,
        accountType: respond.transactionResponse.accountType,
        billingFirstName: billingInformation.firstName || "",
        billingLastName: billingInformation.lastName || "",
        billingCompany: billingInformation.company || "Not applicable",
        billingAddress: billingInformation.address || "",
        billingCity: billingInformation.city || "",
        billingState: billingInformation.state || "",
        billingZip: billingInformation.zip || "",
        billingCountry: billingInformation.country || "",
        billingEmail: billingInformation.email || "",
        billingPhoneNumber: billingInformation.phoneNumber || "",
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

    const emailSubject = getEmailSubject(drivingSchool);
    const emailBody = getEmailBody(drivingSchool, accountInformation);

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
      sectionID: activeSection.sectionID,
      message: "The enrollment process was successful",
      courseType: courseResult.courseType
    });
  } catch (error) {
    if (!error.code) {
      console.log("ERROR: ", error.message); // eslint-disable-line
      res.status(400).json({ error: error.message });
      return;
    }
    console.log("ERROR: ", error.message); // eslint-disable-line
    res.status(400).json(error);
  }
};

export default enrollStudent;
