import { QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch the section if the type of the course is online
---- /api/student/section (GET)
*/
const fetchSection = async (req, res) => {
  try {
    const { courseID } = req.query;
    const { drivingSchoolID } = req.body;
    if (!courseID) throw Error("Course ID must be provided");

    const getCourseCommand = new GetCommand({
      TableName: process.env.COURSE_TABLE,
      Key: {
        courseID
      },
      ProjectionExpression: "courseID, courseType"
    });

    const { Item: course } = await dynamoClient.send(getCourseCommand);

    if (!course) throw Error("Invalid course ID");

    if (course.courseType !== "Online")
      return res.status(200).json({ message: "Course is non-online type" });

    const queryActiveSectionCommand = new QueryCommand({
      TableName: process.env.SECTION_TABLE,
      IndexName: "DrivingSchoolIndex",
      KeyConditionExpression: "drivingSchoolID = :drivingSchoolIDValue",
      FilterExpression: "isActive = :isActiveValue",
      ExpressionAttributeValues: {
        ":drivingSchoolIDValue": drivingSchoolID,
        ":isActiveValue": true
      },
      ProjectionExpression: "sectionID, sectionTitle"
    });

    const { Items } = await dynamoClient.send(queryActiveSectionCommand);

    const activeSection = Items?.[0];

    if (!activeSection) throw Error("The driving school has no active section");

    res.status(400).json({ ...activeSection });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchSection;
