import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import payment from "../../utils/payment.js";
import dynamoClient from "../../db_connection/dbCLient.js";

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
      courseInformation,
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
      !accountInformation?.confirmPassWord
    )
      throw Error("Account information must be complete");

    if (
      !mailingInformation?.firstName ||
      !mailingInformation?.lastName ||
      !mailingInformation?.company ||
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
      !billingInformation?.company ||
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

    if (
      !courseInformation?.courseName ||
      !courseInformation?.coursePrice ||
      !courseInformation?.courseID
    )
      throw Error("Course information must be complete");

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
      getFinalChargeAmount(couponItem, courseInformation.coursePrice).toFixed(2)
    );

    if (finalChargeAmount === 0)
      throw Error("The coupon code is not applicable for this transaction");

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

    const paymentID = nanoid(20);

    const salt = await bcrypt.genSalt(10);
    const hashedPassWord = await bcrypt.hash(accountInformation.passWord, salt);

    // Create a request to Authorize.net API Gateway
    // to charge the credit card3
    const respond = await payment(
      drivingSchoolCredentials,
      accountInformation,
      mailingInformation,
      billingInformation,
      cardInformation,
      courseInformation,
      finalChargeAmount,
      paymentID
    );

    if (respond.messages.resultCode !== "Ok")
      return res.status(400).json(respond);

    // Add the student to database upon the
    // successful payment transaction
    const putCommand = new PutCommand({
      TableName: process.env.STUDENT_TABLE,
      Item: {
        drivingSchoolID: drivingSchoolCredentials.drivingSchoolID,
        studentUserName: accountInformation.userName,
        passWord: hashedPassWord,
        courseID: courseInformation.courseID,
        usedCouponCode: couponCode,
        paymentID: respond.refId,
        transactionID: respond.transactionResponse.transId,
        accountNumber: respond.transactionResponse.accountNumber,
        accountType: respond.transactionResponse.accountType,
        billingFirstName: billingInformation.firstName,
        billingLastName: billingInformation.lastName,
        billingCompany: billingInformation.company,
        billingAddress: billingInformation.address,
        billingCity: billingInformation.city,
        billingState: billingInformation.state,
        billingZip: billingInformation.zip,
        billingCountry: billingInformation.country,
        billingEmail: billingInformation.email,
        billingPhoneNumber: billingInformation.phoneNumber,
        mailingFirstName: mailingInformation.firstName,
        mailingLastName: mailingInformation.lastName,
        mailingCompany: mailingInformation.company,
        mailingAddress: mailingInformation.address,
        mailingCity: mailingInformation.city,
        mailingState: mailingInformation.state,
        mailingZip: mailingInformation.zip,
        mailingCountry: mailingInformation.country,
        mailingEmail: mailingInformation.email,
        mailingPhoneNumber: mailingInformation.phoneNumber,
        enrollmentDate: Date(),
        paidAmount: finalChargeAmount
      }
    });

    await dynamoClient.send(putCommand);

    res.status(200).json({
      drivingSchoolID: drivingSchoolCredentials.drivingSchoolID,
      userName: accountInformation.userName,
      paymentID: respond.refId,
      transactionID: respond.transactionResponse.transId,
      paidAmount: finalChargeAmount,
      message: "The enrollment process was successful"
    });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default enrollStudent;
