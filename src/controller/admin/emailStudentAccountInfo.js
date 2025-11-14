import { getStudent } from "../../utils/dbUtils/student.js";

import invokeFunction from "../../lambda_invoke_connection/invokeFunction.js";
import { studentAccountDetailEmail } from "../../constants/index.js";

/*
---- Controller to email the account information of a student
---- /api/admin/student/account/email (GET)
*/
const emailStudentAccountInfo = async (req, res) => {
  try {
    const { drivingSchoolID } = req.body;
    const { studentUserName } = req.query;

    if (!studentUserName) throw Error("Student username is required");

    const { Item: student } = await getStudent(
      drivingSchoolID,
      studentUserName
    );
    if (!student) throw Error("Student does not exist");

    const { mailingFirstName, mailingEmail } = student;
    const emailBody = studentAccountDetailEmail.emailBody
      .replace("{ fullName }", `${mailingFirstName || ""}`)
      .replace("{ userName }", studentUserName);

    const invokeFunctionArgs = {
      invokePath: "/api/student/send-email",
      headers: {
        "x-api-key": process.env.API_KEY
      },
      method: "POST",
      body: {
        emailReceiver: mailingEmail,
        emailSubject: studentAccountDetailEmail.emailSubject,
        emailBody: emailBody
      }
    };

    await invokeFunction(invokeFunctionArgs);

    return res
      .status(200)
      .json({ message: "Student account information has been emailed" });
  } catch (error) {
    if (!error.code) return res.status(400).json({ error: error.message });
    res.status(400).json(error);
  }
};

export default emailStudentAccountInfo;
