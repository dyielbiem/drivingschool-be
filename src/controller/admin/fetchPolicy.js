import { GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to get the policy of a driving school
---- /api/admin/policy (GET)
*/
const fetchPolicy = async (req, res) => {
  try {
    const { drivingSchoolID } = req.body;

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

export default fetchPolicy;
