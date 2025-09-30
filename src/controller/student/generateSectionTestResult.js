import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";

import dynamoClient from "../../db_connection/dbCLient.js";
import invokeFunction from "../../lambda_invoke_connection/invokeFunction.js";
import { getDrivingSchool } from "../../utils/dbUtils/drivingSchool.js";
import { getSection } from "../../utils/dbUtils/section.js";
import { getStudent, updateStudentItem } from "../../utils/dbUtils/student.js";
import { getStudentResultPerChapterAndSection } from "../../utils/dbUtils/result.js";
import { getSectionQuestions } from "../../utils/dbUtils/question.js";

const generateCompletionEmailBody = (studentUserName, results) =>
  `
    <div style="max-width: 600px;">
      <p style="margin-bottom: 16px; font-size:16px;">
        Hello Admin,
      </p>
      <p style="margin-bottom: 12px; font-size:16px;">
        This is to inform you that student <strong>${studentUserName}</strong>
        has successfully completed the online course. The test scores are listed below.
      </p>
      <div>
        <strong style="margin: 0px; display: inline; font-size: 16px;">
          Chapters
        </strong>
        <strong style="margin: 0px; float: right; display: inline; font-size: 16px;">
          Score
        </strong>
      </div>
      ${results
        .map((r) => {
          const {
            chapterTitle,
            sectionTitle,
            hasTest,
            score,
            numberOfQuestions
          } = r;
          return `
            <div>
              <p style="margin: 0px; display: inline; font-size: 14px;">
                ${chapterTitle || sectionTitle}
              </p>
              <p style="margin: 0px; float: right; display: inline; font-size: 14px;">
                ${
                  hasTest
                    ? `${((score || 1) / (numberOfQuestions || 1)) * 100}%`
                    : "N/A"
                }
              </p>
            </div>
          `;
        })
        .join("")}
    </div>
  `;

/*
---- Controller to generate the section test result
---- /api/student/section/test/result (POST)
*/
const generateSectionTestResult = async (req, res) => {
  try {
    const { sectionID, answers, studentUserName, drivingSchoolID } = req.body;
    if (!answers) throw Error("All required fields must be filled");
    if (typeof answers === "string")
      throw Error("The field 'answers' must be an array, not a string");
    if (answers.length === 0) throw Error("Answers must not be an empty array");

    const [{ Item: section }, { Items: test }, { Item: student }] =
      await Promise.all([
        getSection(sectionID),
        getSectionQuestions(sectionID),
        getStudent(drivingSchoolID, studentUserName)
      ]);

    if (!section) throw Error("Section does not exist");
    if (test.length === 0) throw Error("Section has no test");
    if (!student) throw Error("Student does not exist");

    // Check if the length of provided answers is valid
    const { noOfQuestionsToShow } = section;
    const hasAnswersLengthError =
      !noOfQuestionsToShow || noOfQuestionsToShow > test.length
        ? answers.length !== test.length
        : noOfQuestionsToShow !== answers.length;

    if (hasAnswersLengthError)
      throw Error(
        "The provided answers does not match the length of the section questions"
      );

    // Calculate the correct answer of the student
    let noOfCorrectAnswers = 0;
    answers.forEach((answer) => {
      if (!answer.questionID)
        throw Error("The answer is present, but the Question ID is missing");

      if (!answer.answer)
        throw Error("The Question ID is present, but the answer is missing");

      const question = test.find(
        (item) => item.questionID === answer.questionID
      );

      if (!question)
        throw Error(
          "One of the answers does not have a corresponding question"
        );

      if (answer.answer === question.correctAnswer) noOfCorrectAnswers += 1;
    });

    const scorePercentage = noOfCorrectAnswers / answers.length;

    const resultID = ulid();
    const isPassed = scorePercentage >= 0.75;
    const putResultCommand = new PutCommand({
      TableName: process.env.RESULT_TABLE,
      Item: {
        resultID,
        drivingSchoolID,
        studentUserName,
        sectionID,
        score: noOfCorrectAnswers,
        numberOfQuestions: answers.length,
        answers,
        scorePercentage: scorePercentage * 100,
        isPassed,
        dateAnswered: Date()
      },
      ConditionExpression: "attribute_not_exists(resultID)"
    });

    await dynamoClient.send(putResultCommand);

    if (isPassed) {
      const [{ Item: drivingSchool }, results] = await Promise.all([
        getDrivingSchool(drivingSchoolID),
        getStudentResultPerChapterAndSection(drivingSchoolID, studentUserName)
      ]);

      const emailArgs = {
        invokePath: "/api/student/send-email",
        headers: {
          "x-api-key": process.env.API_KEY
        },
        method: "POST",
        body: {
          emailReceiver: drivingSchool.email,
          emailSubject: "Student Course Completion",
          emailBody: generateCompletionEmailBody(studentUserName, results)
        }
      };

      await Promise.all([
        invokeFunction(emailArgs),
        updateStudentItem(drivingSchoolID, studentUserName, {
          ":completionDate": Date(),
          ":isCourseCompleted": true
        })
      ]);
    }

    res.status(200).json({
      resultID,
      sectionID,
      numberOfQuestions: answers.length,
      score: noOfCorrectAnswers,
      scorePercentage: scorePercentage * 100,
      isPassed
    });
  } catch (error) {
    if (error.message === "The conditional request failed")
      return res
        .status(400)
        .json({ error: "An error occurred, please try again" });
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json({ error });
  }
};

export default generateSectionTestResult;
