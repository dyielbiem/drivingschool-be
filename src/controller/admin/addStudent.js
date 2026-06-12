import dayjs from "dayjs";
import { nanoid } from "nanoid";
import { parseDate } from "chrono-node";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";
import sendStudentWelcomeEmail from "../../utils/sendStudentWelcomeEmail.js";
import emailAdminAboutNewStudent from "../../utils/emailAdminAboutNewStudent.js";
import payment from "../../utils/payment.js";
import { encrypt } from "../../utils/crypto.js";
import { hashPassWord, validateObject } from "../../utils/index.js";
import {
  getFinalChargeAmount,
  handleAuthorizeResponse
} from "../../utils/enrollment.js";
import { getDrivingSchool } from "../../utils/dbUtils/drivingSchool.js";
import { getStudent } from "../../utils/dbUtils/student.js";
import { getCourse } from "../../utils/dbUtils/course.js";
import { getActiveSection } from "../../utils/dbUtils/section.js";

/*
---- Controller to add a student to a course
---- /api/admin/student (POST)
*/
const addStudent = async (req, res) => {
  try {
    const {
      drivingSchoolID,
      userName,
      courseID,
      passWord,
      confirmPassWord,
      firstName,
      lastName,
      company = "",
      address,
      city,
      state,
      zip,
      email,
      phoneNumber,
      highSchool,
      parentFirstName,
      parentLastName,
      parentEmail,
      parentPhoneNumber,
      birthDate = "",
      billingInformation = null,
      cardInformationAlwaysNull = null,
      couponCode = ""
    } = req.body;

    if (
      !userName ||
      !passWord ||
      !confirmPassWord ||
      !courseID ||
      !firstName ||
      !lastName ||
      !address ||
      !city ||
      !state ||
      !zip ||
      !email ||
      !phoneNumber
    )
      throw Error("All required fields must filled");

    const parsedBirthDate = parseDate(birthDate);
    if (!parsedBirthDate) throw Error("Invalid birth date format");

    if (passWord !== confirmPassWord) throw Error("Passwords do not match");

    const CIFields = ["cardNumber", "cardCode", "cardExpiration"];
    const BIFields = [
      "firstName",
      "lastName",
      "address",
      "city",
      "state",
      "zip",
      "email",
      "phoneNumber"
    ];

    const [
      { Item: drivingSchool },
      { Item: existingStudent },
      { Item: course },
      activeSection
    ] = await Promise.all([
      getDrivingSchool(drivingSchoolID),
      getStudent(drivingSchoolID, userName),
      getCourse(courseID),
      getActiveSection(drivingSchoolID)
    ]);

    if (!drivingSchool) throw Error("Driving school does not exist");
    if (existingStudent) throw Error("Student username is already taken");
    if (!course) throw Error("Invalid course ID");
    if (!activeSection) throw Error("The driving school has no active section");

    const { finalChargeAmount } = await getFinalChargeAmount(
      couponCode,
      drivingSchoolID,
      course.coursePrice
    );

    let response = {
      refId: "",
      transactionResponse: {
        transId: "",
        accountNumber: "",
        accountType: ""
      }
    };

    if (cardInformationAlwaysNull) {
      validateObject(
        cardInformationAlwaysNull,
        CIFields,
        "cardInformationAlwaysNull"
      );
      validateObject(billingInformation, BIFields, "billingInformation");

      if (finalChargeAmount > 0) {
        const paymentID = nanoid(20);

        const drivingSchoolCredentials = {
          drivingSchoolID,
          paymentLogInKey: drivingSchool.paymentLogInKey,
          paymentTransactionKey: drivingSchool.paymentTransactionKey
        };
        const accountInformation = {
          userName,
          passWord,
          confirmPassWord,
          birthDate
        };
        const mailingInformation = {
          firstName,
          lastName,
          company,
          address,
          city,
          state,
          zip,
          country: "United States",
          email,
          phoneNumber
        };

        response = await payment(
          drivingSchoolCredentials,
          accountInformation,
          mailingInformation,
          {
            ...billingInformation,
            country: "United States"
          },
          cardInformationAlwaysNull,
          courseID,
          course.courseName,
          finalChargeAmount,
          paymentID
        );

        const { ok, errorMessage } = handleAuthorizeResponse(response);
        if (!ok) throw Error(errorMessage);
      }
    }

    const hashedPassWord = await hashPassWord(passWord);
    const encryptedPassWord = encrypt(passWord);
    const enrollmentDate = new Date();
    const strBirthDate = dayjs(parsedBirthDate).format("MM-DD-YYYY");

    const transformedBillingInformation = {};
    if (billingInformation) {
      Object.keys(billingInformation).forEach((key) => {
        const transformedKey = `billing${key[0].toUpperCase()}${key.slice(1)}`;
        transformedBillingInformation[transformedKey] = billingInformation[key];
      });

      transformedBillingInformation.billingCountry = "United States";
    }

    const command = new PutCommand({
      TableName: process.env.STUDENT_TABLE,
      Item: {
        drivingSchoolID,
        studentUserName: userName,
        passWord: hashedPassWord,
        encryptedPassWord,
        courseID,
        courseType: course.courseType,
        sectionID: activeSection.sectionID,
        mailingFirstName: firstName,
        mailingLastName: lastName,
        mailingCompany: company,
        mailingAddress: address,
        mailingCity: city,
        mailingState: state,
        mailingZip: zip,
        mailingCountry: "United States",
        mailingEmail: email,
        mailingPhoneNumber: phoneNumber,
        birthDate: strBirthDate,
        enrollmentDate: enrollmentDate.toString(),
        highSchool,
        parentFirstName,
        parentLastName,
        parentEmail,
        parentPhoneNumber,
        isActive: true,
        usedCouponCode: couponCode,
        paymentID: response.refId,
        transactionID: response.transactionResponse.transId,
        accountNumber: response.transactionResponse.accountNumber,
        accountType: response.transactionResponse.accountType,
        paidAmount: cardInformationAlwaysNull ? finalChargeAmount : 0,
        ...transformedBillingInformation
      },
      ConditionExpression:
        "attribute_not_exists(studentUserName) AND attribute_not_exists(drivingSchoolID)"
    });

    await dynamoClient.send(command);

    const emailRequests = [
      sendStudentWelcomeEmail(
        email,
        drivingSchool.emailSubject,
        `${drivingSchool.emailBody || ""}`
          .replace("{ username }", userName)
          .replace("{ password }", passWord)
      ),
      emailAdminAboutNewStudent(
        [
          { label: "First Name", value: firstName },
          { label: "Last Name", value: lastName },
          {
            label: "Date of Birth",
            value: strBirthDate
          },
          { label: "Address", value: address },
          { label: "City", value: city },
          { label: "State", value: state },
          { label: "Zip Code", value: zip },
          { label: "Phone Number", value: phoneNumber },
          { label: "Email Address", value: email },
          {
            label: "Start Date",
            value: dayjs(enrollmentDate).format("MM-DD-YYYY")
          },
          { label: "Username", value: userName },
          { label: "Password", value: passWord },
          { label: "Course", value: course.courseName },
          { label: "Course Price", value: course.coursePrice },
          { label: "Coupon Code", value: "" },
          { label: "Coupon Price", value: "" },
          { label: "School", value: highSchool || "" }
        ],
        drivingSchool.email
      )
    ];
    await Promise.all(emailRequests);

    res.status(200).json({
      drivingSchoolID,
      studentUserName: userName,
      courseID,
      courseType: course.courseType,
      sectionID: activeSection.sectionID,
      mailingFirstName: firstName,
      mailingLastName: lastName,
      mailingCompany: company,
      mailingAddress: address,
      mailingCity: city,
      mailingState: state,
      mailingZip: zip,
      mailingEmail: email,
      mailingPhoneNumber: phoneNumber,
      birthDate: strBirthDate,
      enrollmentDate: enrollmentDate.toString(),
      highSchool,
      parentFirstName,
      parentLastName,
      parentEmail,
      parentPhoneNumber,
      usedCouponCode: couponCode,
      paidAmount: cardInformationAlwaysNull ? finalChargeAmount : 0,
      isActive: true
    });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Student already exists" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default addStudent;
