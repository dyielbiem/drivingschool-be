import { parseDate } from "chrono-node";
import { PutCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";
import invokeFunction from "../../lambda_invoke_connection/invokeFunction.js";
import { hashPassWord } from "../../utils/index.js";

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
      billingInformation = {
        firstName: "",
        lastName: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        email: "",
        phoneNumber: ""
      }
    } = req.body;

    if (
      !userName ||
      !passWord ||
      !courseID ||
      !confirmPassWord ||
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

    if (!parseDate(birthDate)) throw Error("Invalid birth date format");

    if (passWord !== confirmPassWord) throw Error("Passwords do not match");

    const hashedPassword = await hashPassWord(passWord);

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
        ":drivingSchoolIDValue": drivingSchoolID,
        ":isActiveValue": true
      },
      ProjectionExpression: "sectionID"
    });

    const { Items: sectionResult } = await dynamoClient.send(sectionCommand);
    if (sectionResult.length === 0)
      throw Error("The driving school has no active section");

    const command = new PutCommand({
      TableName: process.env.STUDENT_TABLE,
      Item: {
        drivingSchoolID,
        studentUserName: userName,
        passWord: hashedPassword,
        courseID,
        courseType: courseResult.courseType,
        sectionID: sectionResult[0]?.sectionID,
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
        billingFirstName: billingInformation.firstName || "",
        billingLastName: billingInformation.lastName || "",
        billingAddress: billingInformation.address || "",
        billingCity: billingInformation.city || "",
        billingState: billingInformation.state || "",
        billingZip: billingInformation.zip || "",
        billingCountry: "United States",
        billingEmail: billingInformation.email || "",
        billingPhoneNumber: billingInformation.phoneNumber || "",
        birthDate,
        enrollmentDate: Date(),
        highSchool,
        parentFirstName,
        parentLastName,
        parentEmail,
        parentPhoneNumber,
        isActive: true
      },
      ConditionExpression:
        "attribute_not_exists(studentUserName) AND attribute_not_exists(drivingSchoolID)"
    });

    await dynamoClient.send(command);

    const drivingSchoolGetCmd = new GetCommand({
      TableName: process.env.DRIVING_SCHOOL_TABLE,
      Key: {
        drivingSchoolID: drivingSchoolID
      },
      ProjectionExpression: "emailSubject, emailBody, drivingSchoolName"
    });

    const { Item: drivingSchool } =
      await dynamoClient.send(drivingSchoolGetCmd);

    const userNameTemplatePattern = /\{ username \}/g;
    const passWordTemplatePattern = /\{ password \}/g;
    const defaulEmailSubject = `Welcome to ${drivingSchool.drivingSchoolName}`;
    const defaultEmailBody = `Hello ${userName}, welcome aboard to ${drivingSchool.drivingSchoolName}! Get ready to hit the road with confidence.`;

    const emailSubject = drivingSchool.emailSubject || defaulEmailSubject;
    let emailBody = drivingSchool.emailBody || defaultEmailBody;

    emailBody = emailBody
      .replace(userNameTemplatePattern, userName)
      .replace(passWordTemplatePattern, passWord);

    const invokeFunctionArgs = {
      invokePath: "/api/student/send-email",
      headers: {
        "x-api-key": process.env.API_KEY
      },
      method: "POST",
      body: {
        emailReceiver: email,
        emailSubject: emailSubject,
        emailBody: emailBody,
        emailBCC: process.env.ADMIN_EMAIL_RECEIVER
      }
    };

    await invokeFunction(invokeFunctionArgs);

    res.status(200).json({
      drivingSchoolID,
      studentUserName: userName,
      passWord: hashedPassword,
      courseID,
      courseType: courseResult.courseType,
      sectionID: sectionResult[0]?.sectionID,
      mailingFirstName: firstName,
      mailingLastName: lastName,
      mailingCompany: company,
      mailingAddress: address,
      mailingCity: city,
      mailingState: state,
      mailingZip: zip,
      mailingEmail: email,
      mailingPhoneNumber: phoneNumber,
      birthDate,
      enrollmentDate: Date(),
      highSchool,
      parentFirstName,
      parentLastName,
      parentEmail,
      parentPhoneNumber,
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
