import dayjs from "dayjs";
import { parseDate } from "chrono-node";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";
import sendStudentWelcomeEmail from "../../utils/sendStudentWelcomeEmail.js";
import emailAdminAboutNewStudent from "../../utils/emailAdminAboutNewStudent.js";
import { encrypt } from "../../utils/crypto.js";
import { hashPassWord } from "../../utils/index.js";
import { getDrivingSchool } from "../../utils/dbUtils/drivingSchool.js";
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

    const parsedBirthDate = parseDate(birthDate);
    if (!parsedBirthDate) throw Error("Invalid birth date format");

    if (passWord !== confirmPassWord) throw Error("Passwords do not match");

    // Check if course ID is valid
    const { Item: course } = await getCourse(courseID);
    if (!course) throw Error("Invalid course ID");

    // If course is valid, get the active section
    const activeSection = await getActiveSection(drivingSchoolID);
    if (!activeSection) throw Error("The driving school has no active section");

    const hashedPassWord = await hashPassWord(passWord);
    const encryptedPassWord = encrypt(passWord);
    const enrollmentDate = new Date();
    const strBirthDate = dayjs(parsedBirthDate).format("MM-DD-YYYY");

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
        billingFirstName: billingInformation.firstName || "",
        billingLastName: billingInformation.lastName || "",
        billingAddress: billingInformation.address || "",
        billingCity: billingInformation.city || "",
        billingState: billingInformation.state || "",
        billingZip: billingInformation.zip || "",
        billingCountry: "United States",
        billingEmail: billingInformation.email || "",
        billingPhoneNumber: billingInformation.phoneNumber || "",
        birthDate: strBirthDate,
        enrollmentDate: enrollmentDate.toString(),
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

    const { Item: drivingSchool } = await getDrivingSchool(drivingSchoolID);

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
