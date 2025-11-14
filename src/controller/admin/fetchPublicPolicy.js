import { GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to provide policy of a driving school publicly
---- /api/admin/policy/public (GET)
*/
const fetchPublicPolicy = async (req, res) => {
  try {
    const { drivingSchoolID } = req.query;

    if (!drivingSchoolID) throw Error("Driving school ID must be provided");

    const command = new GetCommand({
      TableName: process.env.DRIVING_SCHOOL_TABLE,
      Key: {
        drivingSchoolID
      },
      ProjectionExpression: "drivingSchoolID, policyHTML"
    });

    const { Item: policy } = await dynamoClient.send(command);
    if (!policy) throw Error("Driving school does not exist");

    return res.status(200).json(policy);
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchPublicPolicy;
