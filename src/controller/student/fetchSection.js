import { GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoClient from "../../db_connection/dbCLient.js";

/*
---- Controller to fetch the section if the type of the course is online
---- /api/student/section (GET)
*/
const fetchSection = async (req, res) => {
  try {
    const { courseID, sectionID } = req.body;

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

    res.status(200).json(section);
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default fetchSection;
