import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to update the policy of a driving school
---- /api/admin/policy (PATCH)
*/
const updatePolicy = async (req, res) => {
  try {
    const { drivingSchoolID, policyHTML } = req.body;
    if (!policyHTML) throw Error("Policy must be provided");

    const command = new UpdateCommand({
      TableName: process.env.DRIVING_SCHOOL_TABLE,
      Key: {
        drivingSchoolID
      },
      UpdateExpression: "SET policyHTML = :policyHTMLValue",
      ExpressionAttributeValues: {
        ":policyHTMLValue": policyHTML
      },
      ConditionExpression: "attribute_exists(drivingSchoolID)",
      ReturnValues: "ALL_NEW"
    });

    const { Attributes: updatedPolicy } = await dynamoClient.send(command);

    return res.status(200).json(updatedPolicy);
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res.status(400).json({ error: "Driving school does not exist" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default updatePolicy;
