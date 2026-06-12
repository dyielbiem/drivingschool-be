import Stripe from "stripe";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import { parseDate } from "chrono-node";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

import payment from "../../utils/payment.js";
import dynamoClient from "../../db_connection/dbCLient.js";
import sendStudentWelcomeEmail from "../../utils/sendStudentWelcomeEmail.js";
import emailAdminAboutNewStudent from "../../utils/emailAdminAboutNewStudent.js";
import { requiredBillingInfo } from "../../constants/index.js";
import { hashPassWord } from "../../utils/index.js";
import { encrypt } from "../../utils/crypto.js";
import { getDrivingSchool } from "../../utils/dbUtils/drivingSchool.js";
import { getStudent } from "../../utils/dbUtils/student.js";
import { getCourse } from "../../utils/dbUtils/course.js";
import { getActiveSection } from "../../utils/dbUtils/section.js";
import { getAffiliationByCode } from "../../utils/dbUtils/affiliation.js";
import {
  getFinalChargeAmount,
  handleAuthorizeResponse
} from "../../utils/enrollment.js";

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
      couponCode,
      affiliationCode,
      paymentMethod
    } = req.body;

    if (!drivingSchoolCredentials?.drivingSchoolID)
      throw Error("Driving school credentials must be complete");

    if (
      paymentMethod !== "stripe" &&
      (!drivingSchoolCredentials?.paymentTransactionKey ||
        !drivingSchoolCredentials?.paymentLogInKey)
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

    if (accountInformation.userName.includes(" "))
      throw Error("Username must not include spaces");

    const parsedBirthDate = parseDate(accountInformation.birthDate);
    if (!parsedBirthDate) throw Error("Invalid birth date format");

    if (!courseID) throw Error("Course ID must be provided");

    if (accountInformation?.passWord !== accountInformation?.confirmPassWord)
      throw Error("Passwords do not match");

    let affiliation = null;
    if (affiliationCode) {
      affiliation = await getAffiliationByCode(
        drivingSchoolCredentials.drivingSchoolID,
        affiliationCode
      );
      if (!affiliation) throw Error("Invalid affiliation code");
    }

    const [
      { Item: drivingSchool },
      { Item: student },
      { Item: course },
      activeSection
    ] = await Promise.all([
      getDrivingSchool(drivingSchoolCredentials.drivingSchoolID),
      getStudent(
        drivingSchoolCredentials.drivingSchoolID,
        accountInformation.userName
      ),
      getCourse(courseID),
      getActiveSection(drivingSchoolCredentials.drivingSchoolID)
    ]);

    if (!drivingSchool) throw Error("The driving school does not exist");
    if (student && (student.paymentMethod !== "stripe" || student.isPaid))
      throw Error("Username is already in use");
    if (!course) throw Error("Invalid course ID");
    if (!activeSection) throw Error("The driving school has no active section");

    // Get final charge amount and coupon
    const { finalChargeAmount, coupon } = await getFinalChargeAmount(
      couponCode,
      drivingSchoolCredentials.drivingSchoolID,
      course.coursePrice
    );

    let authorizeResponse = {
      refId: "",
      transactionResponse: {
        transId: "",
        accountNumber: "",
        accountType: ""
      }
    };
    let stripeResponse = null;

    /* 
      Handle non-zero final charge amount
    */
    if (finalChargeAmount > 0) {
      if (paymentMethod === "stripe") {
        const stripe = new Stripe(process.env.STRIPE_SK);
        const paymentIntent = await stripe.paymentIntents.create({
          amount: finalChargeAmount * 100,
          currency: "usd",
          metadata: {
            drivingSchoolID: drivingSchoolCredentials.drivingSchoolID,
            studentUserName: accountInformation.userName,
            courseName: course.courseName?.slice(0, 500),
            coursePrice: course.coursePrice,
            usedCouponCode: coupon?.couponCode || "",
            usedCouponAmount: coupon?.couponAmount || ""
          }
        });

        stripeResponse = {
          isStudentActivated: false,
          paymentIntentID: paymentIntent.id,
          amountToPay: paymentIntent.amount / 100,
          usedCouponCode: coupon?.couponCode || "",
          usedCouponAmount: coupon?.couponAmount || "",
          clientSecret: paymentIntent.client_secret,
          stripePk: process.env.STRIPE_SK
        };
      } else {
        const { cardNumber, cardCode, cardExpiration } = cardInformation || {};

        if (!cardNumber || !cardCode || !cardExpiration) {
          throw Error("Card information must be complete");
        }

        if (requiredBillingInfo.some((field) => !billingInformation?.[field]))
          throw Error("Billing information must be complete");

        const paymentID = nanoid(20);
        authorizeResponse = await payment(
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

        const { ok, errorMessage } = handleAuthorizeResponse(authorizeResponse);
        if (!ok) throw Error(errorMessage);
      }
    }

    const hashedPassWord = await hashPassWord(accountInformation.passWord);
    const encryptedPassWord = encrypt(accountInformation.passWord);
    const enrollmentDate = new Date();
    const strBirthDate = dayjs(parsedBirthDate).format("MM-DD-YYYY");
    const affiliationAttr = affiliation
      ? {
          affiliationID: affiliation.affiliationID,
          affiliationCode: affiliation.affiliationCode
        }
      : {};

    // Add the student to database
    const putCommand = new PutCommand({
      TableName: process.env.STUDENT_TABLE,
      Item: {
        drivingSchoolID: drivingSchoolCredentials.drivingSchoolID,
        studentUserName: accountInformation.userName,
        passWord: hashedPassWord,
        encryptedPassWord,
        courseID: courseID,
        sectionID: activeSection.sectionID,
        usedCouponCode: coupon?.couponCode || "",
        paymentID: authorizeResponse.refId,
        transactionID: authorizeResponse.transactionResponse.transId,
        accountNumber: authorizeResponse.transactionResponse.accountNumber,
        accountType: authorizeResponse.transactionResponse.accountType,
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
        isActive: !stripeResponse,
        paymentMethod: paymentMethod || "authorize",
        courseType: course.courseType,
        ...affiliationAttr
      }
    });
    await dynamoClient.send(putCommand);

    if (stripeResponse) {
      res.status(200).json(stripeResponse);
      return;
    }

    const emailRequests = [
      sendStudentWelcomeEmail(
        mailingInformation.email,
        drivingSchool.emailSubject,
        `${drivingSchool.emailBody || ""}`
          .replace("{ username }", accountInformation.userName)
          .replace("{ password }", accountInformation.passWord)
      ),
      emailAdminAboutNewStudent(
        [
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
        ],
        drivingSchool.email
      )
    ];

    await Promise.all(emailRequests);

    res.status(200).json({
      isStudentActivated: true,
      drivingSchoolID: drivingSchoolCredentials.drivingSchoolID,
      userName: accountInformation.userName,
      paymentID: authorizeResponse.refId,
      transactionID: authorizeResponse.transactionResponse.transId,
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
