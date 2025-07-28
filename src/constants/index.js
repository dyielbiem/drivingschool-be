export const studentAccountDetailEmail = {
  emailSubject: "Cavco Driving Schools - Your Account Information",
  emailBody: `<div><p>Hello { fullName },</p><p>Here is your account information:</p><p><strong>Username: </strong>{ userName }</p><p>To reset your password, please visit the link below and click the 'Forgot Password?' button:</p><p>Student Portal Login: <a href="https://www.myteenpermit.com/student/login" rel="noreferrer noopener" style="color: #1a73e8; text-decoration: underline;">www.myteenpermit.com/student/login</a></p></div>`
};

export const requiredBillingInfo = [
  "firstName",
  "lastName",
  "address",
  "city",
  "state",
  "zip",
  "country",
  "email",
  "phoneNumber"
];
