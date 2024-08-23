import { createRequire } from "module";

const require = createRequire(import.meta.url);
const emailjs = require("@emailjs/nodejs");

const emailSender = async (emailReceiver, emailSubject, emailBody) => {
  const templateParams = {
    emailReceiver,
    emailSubject,
    emailBody
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
    console.error(error);
  }
};

export default emailSender;
