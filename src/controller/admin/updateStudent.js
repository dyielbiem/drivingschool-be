import { parseDate } from "chrono-node";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to edit an enrolled student
---- /api/admin/student (PATCH)
*/
const updateStudent = async (req, res) => {
  try {
    const {
      drivingSchoolID,
      studentUserName,
      isActive,
      mailingFirstName,
      mailingLastName,
      mailingAddress,
      mailingCity,
      mailingState,
      mailingZip,
      mailingCountry,
      mailingEmail,
      mailingPhoneNumber,
      birthDate,
      highSchool
    } = req.body;

    if (
      !studentUserName ||
      !mailingFirstName ||
      !mailingLastName ||
      !mailingAddress ||
      !mailingCity ||
      !mailingState ||
      !mailingZip ||
      !mailingCountry ||
      !mailingEmail ||
      !mailingPhoneNumber
    )
      throw Error("All required field must be filled");

    if (!parseDate(birthDate)) throw Error("Invalide birth date format");

    if (typeof isActive !== "boolean")
      throw Error("isActive must be a boolean");

    const updateCommand = new UpdateCommand({
      TableName: process.env.STUDENT_TABLE,
      Key: {
        drivingSchoolID,
        studentUserName
      },
      UpdateExpression:
        "SET isActive = :isActiveValue, mailingFirstName = :mailingFirstNameValue, mailingLastName = :mailingLastNameValue, mailingAddress = :mailingAddressValue, mailingCity = :mailingCityValue, mailingState = :mailingStateValue, mailingZip = :mailingZipValue, mailingCountry = :mailingCountryValue, mailingEmail = :mailingEmailValue, mailingPhoneNumber = :mailingPhoneNumberValue, birthDate = :birthDateValue, highSchool = :highSchoolValue",
      ExpressionAttributeValues: {
        ":isActiveValue": isActive,
        ":mailingFirstNameValue": mailingFirstName,
        ":mailingLastNameValue": mailingLastName,
        ":mailingAddressValue": mailingAddress,
        ":mailingCityValue": mailingCity,
        ":mailingStateValue": mailingState,
        ":mailingZipValue": mailingZip,
        ":mailingCountryValue": mailingCountry,
        ":mailingEmailValue": mailingEmail,
        ":mailingPhoneNumberValue": mailingPhoneNumber,
        ":birthDateValue": birthDate,
        ":highSchoolValue": highSchool || ""
      },
      ConditionExpression:
        "attribute_exists(drivingSchoolID) AND attribute_exists(studentUserName)"
    });

    await dynamoClient.send(updateCommand);

    res.status(200).json({
      isActive,
      mailingFirstName,
      mailingLastName,
      mailingAddress,
      mailingCity,
      mailingState,
      mailingZip,
      mailingCountry,
      mailingEmail,
      mailingPhoneNumber,
      highSchool: highSchool || ""
    });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Student does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updateStudent;
