import invokeFunction from "../lambda_invoke_connection/invokeFunction.js";

export default async (studentEmail, emailSubject, emailBody) => {
  const requestConfig = {
    invokePath: "/api/student/send-email",
    headers: {
      "x-api-key": process.env.API_KEY
    },
    method: "POST",
    body: {
      emailReceiver: studentEmail,
      emailSubject: emailSubject || "Welcome to Driving School",
      emailBody:
        emailBody ||
        "Hello student, welcome aboard and get ready to hit the road with confidence"
    }
  };

  await invokeFunction(requestConfig);
};
