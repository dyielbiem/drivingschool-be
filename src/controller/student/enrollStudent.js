import dayjs from "dayjs";
import { nanoid } from "nanoid";
import { parseDate } from "chrono-node";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

import payment from "../../utils/payment.js";
import dynamoClient from "../../db_connection/dbCLient.js";
import sendStudentWelcomeEmail from "../../utils/sendStudentWelcomeEmail.js";
import emailAdminAboutNewStudent from "../../utils/emailAdminAboutNewStudent.js";
import { hashPassWord } from "../../utils/index.js";
import { getDrivingSchool } from "../../utils/dbUtils/drivingSchool.js";
import { getStudent } from "../../utils/dbUtils/student.js";
import { getCourse } from "../../utils/dbUtils/course.js";
import { getActiveSection } from "../../utils/dbUtils/section.js";
import { getCoupon } from "../../utils/dbUtils/coupon.js";

const getFinalChargeAmount = (coupon, chargeAmount) => {
  const finalChargeAmount = !coupon?.couponAmount
    ? chargeAmount
    : coupon?.couponAmount >= chargeAmount
      ? 0
      : chargeAmount - (coupon?.couponAmount || 0);

  return finalChargeAmount;
};

const validateCoupon = async (couponCode, drivingSchoolID) => {
  if (!couponCode) {
    return [null, true];
  }

  const { Item: coupon } = await getCoupon(
    couponCode?.toLowerCase?.(),
    drivingSchoolID
  );

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

    const parsedBirthDate = parseDate(accountInformation.birthDate);
    if (!parsedBirthDate) throw Error("Invalid birth date format");

    if (!courseID) throw Error("Course ID must be provided");

    if (accountInformation?.passWord !== accountInformation?.confirmPassWord)
      throw Error("Passwords do not match");

    const dbResults = await Promise.all([
      getDrivingSchool(drivingSchoolCredentials.drivingSchoolID),
      getStudent(
        drivingSchoolCredentials.drivingSchoolID,
        accountInformation.userName
      ),
      getCourse(courseID),
      getActiveSection(drivingSchoolCredentials.drivingSchoolID)
    ]);

    const [
      { Item: drivingSchool },
      { Item: student },
      { Item: course },
      activeSection
    ] = dbResults;

    if (!drivingSchool) throw Error("The driving school does not exist");
    if (student) throw Error("Username is already in use");
    if (!course) throw Error("Invalid course ID");
    if (!activeSection) throw Error("The driving school has no active section");

    // Check if the provided coupon is valid
    const [coupon, isCouponValid] = await validateCoupon(
      couponCode,
      drivingSchoolCredentials.drivingSchoolID
    );
    if (!isCouponValid) throw Error("Invalid coupon code");

    // Get the final charge amount
    const finalChargeAmount = getFinalChargeAmount(coupon, course.coursePrice);

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
      const requiredBillingInfo = [
        "firstName",
        "lastName",
        "address",
        "city",
        "state",
        "zip",
        "country",
        "email",
        "phoneNumber"
      ];

      if (!cardNumber || !cardCode || !cardExpiration) {
        throw Error("Card information must be complete");
      }

      if (requiredBillingInfo.some((field) => !billingInformation?.[field]))
        throw Error("Billing information must be complete");

      const paymentID = nanoid(20);
      respond = await payment(
        drivingSchoolCredentials,
        accountInformation,
        mailingInformation,
        billingInformation,
        cardInformation,
        courseID,
        course.courseName,
        finalChargeAmount,
        paymentID
      );

      const { resultCode, message } = respond.messages || {};
      const { errors, responseCode } = respond.transactionResponse || {};

      if (resultCode !== "Ok")
        throw Error(
          errors?.[0]?.errorText ||
            message?.[0]?.text ||
            "An error occured in payment transaction"
        );

      if (responseCode !== "1")
        throw Error(errors?.[0]?.errorText || "The credit card was declined");
    }

    const hashedPassWord = await hashPassWord(accountInformation.passWord);
    const enrollmentDate = new Date();
    const strBirthDate = dayjs(parsedBirthDate).format("MM-DD-YYYY");

    // Add the student to database
    const putCommand = new PutCommand({
      TableName: process.env.STUDENT_TABLE,
      Item: {
        drivingSchoolID: drivingSchoolCredentials.drivingSchoolID,
        studentUserName: accountInformation.userName,
        passWord: hashedPassWord,
        courseID: courseID,
        sectionID: activeSection.sectionID,
        usedCouponCode: coupon?.couponCode || "",
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
        mailingCompany: mailingInformation.company || "",
        mailingAddress: mailingInformation.address,
        mailingCity: mailingInformation.city,
        mailingState: mailingInformation.state,
        mailingZip: mailingInformation.zip,
        mailingCountry: mailingInformation.country,
        mailingEmail: mailingInformation.email,
        mailingPhoneNumber: mailingInformation.phoneNumber,
        highSchool: accountInformation.highSchool || "",
        birthDate: strBirthDate,
        enrollmentDate: enrollmentDate.toString(),
        paidAmount: finalChargeAmount,
        isActive: true,
        courseType: course.courseType
      }
    });

    await dynamoClient.send(putCommand);

    const emailRequests = [
      sendStudentWelcomeEmail(
        mailingInformation.email,
        drivingSchool.emailSubject,
        `${drivingSchool.emailBody || ""}`
          .replace("{ username }", accountInformation.userName)
          .replace("{ password }", accountInformation.passWord)
      ),
      emailAdminAboutNewStudent([
        { label: "First Name", value: mailingInformation.firstName },
        { label: "Last Name", value: mailingInformation.lastName },
        { label: "Date of Birth", value: strBirthDate },
        { label: "Address", value: mailingInformation.address },
        { label: "City", value: mailingInformation.city },
        { label: "State", value: mailingInformation.state },
        { label: "Zip Code", value: mailingInformation.zip },
        { label: "Phone Number", value: mailingInformation.phoneNumber },
        { label: "Email Address", value: mailingInformation.email },
        {
          label: "Start Date",
          value: dayjs(enrollmentDate).format("MM-DD-YYYY")
        },
        { label: "Username", value: accountInformation.userName },
        { label: "Password", value: accountInformation.passWord },
        { label: "Course", value: course.courseName },
        { label: "Course Price", value: course.coursePrice },
        { label: "Coupon Code", value: coupon?.couponCode || "" },
        { label: "Coupon Price", value: coupon?.couponAmount || "" },
        { label: "School", value: accountInformation.highSchool || "" }
      ])
    ];

    await Promise.all(emailRequests);

    res.status(200).json({
      drivingSchoolID: drivingSchoolCredentials.drivingSchoolID,
      userName: accountInformation.userName,
      paymentID: respond.refId,
      transactionID: respond.transactionResponse.transId,
      paidAmount: finalChargeAmount,
      sectionID: activeSection.sectionID,
      message: "The enrollment process was successful",
      courseType: course.courseType
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
