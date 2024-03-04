import { GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to get the site setting of a driving school
---- /api/admin/setting/site (GET)
*/
const fetchSiteSettings = async (req, res) => {
  try {
    const { drivingSchoolID } = req.body;

    const command = new GetCommand({
      TableName: process.env.DRIVING_SCHOOL_TABLE,
      Key: {
        drivingSchoolID
      },
      ProjectionExpression:
        "drivingSchoolID, drivingSchoolName, email, noOfRows"
    });

    const { Item: siteSettings } = await dynamoClient.send(command);
    if (!siteSettings) throw Error("Driving school does not exist");

    return res.status(200).json(siteSettings);
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchSiteSettings;
