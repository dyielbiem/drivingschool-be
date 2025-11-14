import emailSender from "../../utils/emailSender.js";

const sendEmail = async (req, res) => {
  const { emailReceiver, emailSubject, emailBody, emailBCC } = JSON.parse(
    req.apiGateway.event.body
  );

  await emailSender(emailReceiver, emailSubject, emailBody, emailBCC);

  res.status(200).json({ message: "Email sent" });
};

export default sendEmail;
