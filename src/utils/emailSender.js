import nodemailer from "nodemailer";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const emailjs = require("@emailjs/nodejs");

const nodeMailer = (emailReceiver, emailSubject, emailBody, emailBCC) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: emailReceiver,
    bcc: emailBCC || "",
    subject: emailSubject,
    replyTo: "john@webact.com",
    html: emailBody
  };

  return new Promise((resolve) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        // eslint-disable-next-line no-console
        console.log(error);
        resolve(error);
      } else {
        resolve(info);
      }
    });
  });
};

const emailJS = async (emailReceiver, emailSubject, emailBody, emailBCC) => {
  const templateParams = {
    emailReceiver,
    emailSubject,
    emailBody,
    emailBCC: emailBCC || ""
  };

  try {
    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};

const emailSender = process.env.STAGE !== "dev" ? nodeMailer : emailJS;
export default emailSender;
