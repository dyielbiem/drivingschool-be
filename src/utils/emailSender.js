import nodemailer from "nodemailer";

const emailSender = (
  emailReceiver,
  emailSubject,
  emailBody,
  username,
  password
) => {
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
    html: `<p>${emailBody}</p>
    <p><strong>Account Details </strong><br/> 
    <strong>Username: </strong>${username}<br/>
    <strong>Password: </strong> ${password} <br/></p>`
  };

  return new Promise((resolve) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        resolve(error);
      } else {
        resolve(info);
      }
    });
  });
};

export default emailSender;
