import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to update the email content of a driving school
---- /api/admin/setting/email (PATCH)
*/
const updateEmailContent = async (req, res) => {
  try {
    const { drivingSchoolID, emailSubject, emailBody } = req.body;

    const command = new UpdateCommand({
      TableName: process.env.DRIVING_SCHOOL_TABLE,
      Key: {
        drivingSchoolID
      },
      UpdateExpression:
        "SET emailSubject = :emailSubjectValue, emailBody = :emailBodyValue",
      ExpressionAttributeValues: {
        ":emailSubjectValue": emailSubject || "",
        ":emailBodyValue": emailBody || ""
      },
      ConditionExpression: "attribute_exists(drivingSchoolID)",
      ReturnValues: "ALL_NEW"
    });

    const { Attributes: updatedEmailContent } =
      await dynamoClient.send(command);

    return res.status(200).json(updatedEmailContent);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Driving school does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updateEmailContent;
