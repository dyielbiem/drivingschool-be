import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch the section if the type of the course is online
---- /api/student/section (GET)
*/
const fetchSection = async (req, res) => {
  try {
    const { courseID, sectionID, drivingSchoolID, studentUserName } = req.body;

    const getCourseCommand = new GetCommand({
      TableName: process.env.COURSE_TABLE,
      Key: {
        courseID: courseID
      },
      ProjectionExpression: "courseID, courseType"
    });

    const { Item: course } = await dynamoClient.send(getCourseCommand);
    if (!course) throw Error("Invalid course ID");

    if (course.courseType !== "Online")
      return res.status(200).json({ message: "Course is non-online type" });

    const getSectionCommand = new GetCommand({
      TableName: process.env.SECTION_TABLE,
      Key: {
        sectionID: sectionID
      },
      ProjectionExpression: "sectionID, sectionTitle"
    });

    const { Item: section } = await dynamoClient.send(getSectionCommand);

    if (!section) throw Error("The student does not belong to any section");

    const sectionTestCommand = new QueryCommand({
      TableName: process.env.RESULT_TABLE,
      IndexName: "StudentIndex",
      KeyConditionExpression:
        "drivingSchoolID = :drivingSchoolIDValue AND studentUserName = :studentUserNameValue",
      FilterExpression: "attribute_exists(sectionID)",
      ExpressionAttributeValues: {
        ":drivingSchoolIDValue": drivingSchoolID,
        ":studentUserNameValue": studentUserName
      }
    });

    const { Items: sectionTestResults } =
      await dynamoClient.send(sectionTestCommand);

    if (sectionTestResults?.length === 0) return res.status(200).json(section);

    sectionTestResults.sort((a, b) => b.resultID.localeCompare(a.resultID));

    res.status(200).json({ ...section, testResult: sectionTestResults[0] });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchSection;
