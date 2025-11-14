import { QueryCommand } from "@aws-sdk/lib-dynamodb";

import dynamoClient from "../../db_connection/dbCLient.js";
import { getStudent } from "./student.js";
import { getDrivingSchoolQuestions } from "./question.js";
import { getSectionChapters } from "./chapter.js";

export const getStudentResults = async (
  drivingSchoolID,
  studentUserName,
  otherArgs = {}
) => {
  const command = new QueryCommand({
    TableName: process.env.RESULT_TABLE,
    IndexName: "StudentIndex",
    KeyConditionExpression:
      "drivingSchoolID = :drivingSchoolID AND studentUserName = :studentUserName",
    ExpressionAttributeValues: {
      ":drivingSchoolID": drivingSchoolID,
      ":studentUserName": studentUserName
    },
    ...otherArgs
  });

  const result = await dynamoClient.send(command);
  return result;
};

export const getStudentResultPerChapterAndSection = async (
  drivingSchoolID,
  studentUserName
) => {
  const { Item: student } = await getStudent(drivingSchoolID, studentUserName);
  if (!student) throw Error("Student does not exist");

  const { sectionID } = student;
  const dbPromises = [
    getSectionChapters(sectionID),
    getStudentResults(drivingSchoolID, studentUserName),
    getDrivingSchoolQuestions(drivingSchoolID)
  ];

  const [{ Items: chapters }, { Items: results }, { Items: questions }] =
    await Promise.all(dbPromises);

  const sortedChapters = chapters.sort(
    (a, b) => (a.chapterOrder || 0) - (b.chapterOrder || 0)
  );
  const sortedResults = results.sort((a, b) => {
    if (a.sectionID && !b.sectionID) return 1;
    if (b.sectionID && !a.sectionID) return -1;
    return b.resultID.localeCompare(a.resultID);
  });

  const allResults = sortedChapters.map(({ chapterID, chapterTitle }) => {
    const hasTest = questions.find((q) => q.chapterID === chapterID);
    const result =
      sortedResults.find((r) => r.chapterID === chapterID && r.isPassed) ||
      sortedResults.find((r) => r.chapterID === chapterID) ||
      {};

    return {
      chapterID,
      chapterTitle,
      hasTest,
      ...result
    };
  });

  const sectionResult =
    sortedResults.find((r) => r.sectionID === sectionID && r.isPassed) ||
    sortedResults.find((r) => r.sectionID === sectionID) ||
    {};

  allResults.push({
    sectionID,
    sectionTitle: "Final Test",
    hasTest: !!Object.keys(sectionResult).length,
    ...sectionResult
  });

  return allResults;
};
