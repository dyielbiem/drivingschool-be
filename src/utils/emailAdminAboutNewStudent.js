import invokeFunction from "../lambda_invoke_connection/invokeFunction.js";

const getEmailBody = (fields) => {
  let emailBody = `
    <p style="margin: 0px">Dear Admin,</p>
    <p>A new student has been registered for a driving school package</p>
    <p style="margin: 0px">Student details:</p>
  `;

  fields.forEach((field) => {
    const { label, value } = field;
    emailBody += `
      <p style="margin: 0px">
        <strong>${label}:</strong>
        <span>${value}</span>
      </p>
    `;
  });

  return emailBody;
};

export default async (fields, emailReceiver) => {
  const requestConfig = {
    invokePath: "/api/student/send-email",
    headers: {
      "x-api-key": process.env.API_KEY
    },
    method: "POST",
    body: {
      emailReceiver: emailReceiver || process.env.ADMIN_EMAIL_RECEIVER,
      emailSubject: "New Student Enrollment",
      emailBody: getEmailBody(fields)
    }
  };

  await invokeFunction(requestConfig);
};
