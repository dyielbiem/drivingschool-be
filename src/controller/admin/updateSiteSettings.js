import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to update the site setting of a driving school
---- /api/admin/setting/site (PATCH)
*/
const updateSiteSettings = async (req, res) => {
  try {
    const { drivingSchoolID, email, noOfRows } = req.body;
    if (!email || !noOfRows)
      throw Error("All required fields must be provided");
    if (typeof noOfRows !== "number") throw Error("Rows must be a number");

    const command = new UpdateCommand({
      TableName: process.env.DRIVING_SCHOOL_TABLE,
      Key: {
        drivingSchoolID
      },
      UpdateExpression: "SET email = :emailValue, noOfRows = :noOfRowsValue",
      ExpressionAttributeValues: {
        ":emailValue": email,
        ":noOfRowsValue": noOfRows
      },
      ConditionExpression: "attribute_exists(drivingSchoolID)",
      ReturnValues: "ALL_NEW"
    });

    const { Attributes: updatedSiteSettings } =
      await dynamoClient.send(command);

    return res.status(200).json(updatedSiteSettings);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Driving school does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updateSiteSettings;
