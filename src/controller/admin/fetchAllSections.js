import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch all the sections of a driving school
---- /api/admin/section/list (GET)
*/
const fetchAllSections = async (req, res) => {
  try {
    const { drivingSchoolID } = req.body;

    const command = new QueryCommand({
      TableName: process.env.SECTION_TABLE,
      IndexName: "DrivingSchoolIndex",
      KeyConditionExpression: "drivingSchoolID = :drivingSchoolIDValue",
      ExpressionAttributeValues: {
        ":drivingSchoolIDValue": drivingSchoolID
      },
      ProjectionExpression:
        "sectionID, sectionTitle, isActive, noOfQuestionsToShow"
    });

    const result = await dynamoClient.send(command);
    if (result.Items.length === 0)
      return res.status(200).json({ sections: [] });

    const sortedSections = result.Items.sort((a, b) =>
      b.sectionID.localeCompare(a.sectionID)
    );

    res.status(200).json({ sections: sortedSections });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchAllSections;
