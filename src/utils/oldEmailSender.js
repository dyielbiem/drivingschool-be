import nodemailer from "nodemailer";

const emailSender = (emailReceiver, emailSubject, emailBody) => {
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
    subject: emailSubject,
    replyTo: "john@webact.com",
    html: emailBody
  };

  return new Promise((resolve) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        resolve(error);
      } else {
        resolve(info);
        console.log(info);
      }
    });
  });

  // try {
  //   const response = await fetch(
  //     "https://api.emailjs.com/api/v1.0/email/send",
  //     {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json"
  //       },
  //       body: JSON.stringify({
  //         service_id: process.env.EMAILJS_SERVICE_ID,
  //         template_id: process.env.EMAILJS_TEMPLATE_ID,
  //         user_id: process.env.EMAILJS_PUBLIC_KEY,
  //         accessToken: process.env.EMAILJS_PRIVATE_KEY,
  //         template_params: templateParams
  //       })
  //     }
  //   );

  //   if (response.ok) return;

  //   const errorMessage = await response.text();
  //   console.log(errorMessage);
  // } catch (error) {
  //   console.log(error);
  // }
};

export default emailSender;
