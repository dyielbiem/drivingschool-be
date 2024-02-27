import bcrypt from "bcryptjs";
import { PutCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

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
      company,
      address,
      city,
      state,
      zip,
      country,
      email,
      phoneNumber
    } = req.body;

    if (
      !userName ||
      !passWord ||
      !courseID ||
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
      !phoneNumber
    )
      throw Error("All required fields must filled");

    if (passWord !== confirmPassWord) throw Error("Passwords do not match");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passWord, salt);

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
        mailingCountry: country,
        mailingEmail: email,
        mailingPhoneNumber: phoneNumber,
        enrollmentDate: Date(),
        isActive: true
      },
      ConditionExpression:
        "attribute_not_exists(studentUserName) AND attribute_not_exists(drivingSchoolID)"
    });

    await dynamoClient.send(command);

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
      mailingCountry: country,
      mailingEmail: email,
      mailingPhoneNumber: phoneNumber,
      enrollmentDate: Date(),
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
