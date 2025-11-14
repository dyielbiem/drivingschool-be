import { parseDate } from "chrono-node";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";

const requiredFields = [
  "studentUserName",
  "mailingFirstName",
  "mailingLastName",
  "mailingAddress",
  "mailingCity",
  "mailingState",
  "mailingZip",
  "mailingCountry",
  "mailingEmail",
  "mailingPhoneNumber"
];

const fieldsToUpdate = [
  "isActive",
  "mailingFirstName",
  "mailingLastName",
  "mailingAddress",
  "mailingCity",
  "mailingState",
  "mailingZip",
  "mailingCountry",
  "mailingEmail",
  "mailingPhoneNumber",
  "birthDate",
  "highSchool",
  "parentFirstName",
  "parentLastName",
  "parentEmail",
  "parentPhoneNumber",
  "billingFirstName",
  "billingLastName",
  "billingAddress",
  "billingCity",
  "billingState",
  "billingZip",
  "billingEmail",
  "billingPhoneNumber"
];

/*
---- Controller to edit an enrolled student
---- /api/admin/student (PATCH)
*/
const updateStudent = async (req, res) => {
  try {
    const { drivingSchoolID, studentUserName, isActive, birthDate } = req.body;

    if (requiredFields.some((field) => !(field in req.body)))
      throw Error("All required field must be filled");

    if (!parseDate(birthDate)) throw Error("Invalide birth date format");

    if (typeof isActive !== "boolean")
      throw Error("isActive must be a boolean");

    const { expression, expressionValues } = fieldsToUpdate.reduce(
      (acc, field) => {
        if (!(field in req.body)) return acc;

        acc.expression.push(`${field} = :${field}`);
        acc.expressionValues[`:${field}`] = req.body[field];
        return acc;
      },
      { expression: [], expressionValues: {} }
    );

    const updateCommand = new UpdateCommand({
      TableName: process.env.STUDENT_TABLE,
      Key: {
        drivingSchoolID,
        studentUserName
      },
      UpdateExpression: `SET ${expression.join(", ")}`,
      ExpressionAttributeValues: expressionValues,
      ConditionExpression:
        "attribute_exists(drivingSchoolID) AND attribute_exists(studentUserName)",
      ReturnValues: "ALL_NEW"
    });

    const { Attributes: student } = await dynamoClient.send(updateCommand);
    delete student.passWord;

    res.status(200).json(student);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Student does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updateStudent;
