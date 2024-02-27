import authorizenet from "authorizenet";
import { decrypt } from "./crypto.js";

const compressedField = (field, maxLength) => {
  if (field.length <= maxLength) return field;
  return `${field.substring(0, maxLength - 3)}...`;
};

/*
---- Utility function to make a request to Authorize API Gateway 
---- to create a payment transaction
*/
const payment = (
  drivingSchoolCredentials,
  accountInformation,
  mailingInformation,
  billingInformation,
  cardInformation,
  courseID,
  courseName,
  finalChargeAmount,
  paymentID
) => {
  const { APIContracts } = authorizenet;
  const { APIControllers } = authorizenet;

  const decryptedPaymentLogInKey = decrypt(
    drivingSchoolCredentials.paymentLogInKey
  );
  const decryptedPaymentTransactionKey = decrypt(
    drivingSchoolCredentials.paymentTransactionKey
  );

  const merchantAuthentication = new APIContracts.MerchantAuthenticationType();
  merchantAuthentication.setName(decryptedPaymentLogInKey);
  merchantAuthentication.setTransactionKey(decryptedPaymentTransactionKey);

  const customer = new APIContracts.CustomerType();
  customer.setId(compressedField(accountInformation.userName, 20));
  customer.setEmail(compressedField(billingInformation.email, 255));
  customer.setType("individual");

  const billTo = new APIContracts.CustomerAddressType();
  billTo.setFirstName(compressedField(billingInformation.firstName, 50));
  billTo.setLastName(compressedField(billingInformation.lastName, 50));
  billTo.setCompany(compressedField(billingInformation.company, 50));
  billTo.setAddress(compressedField(billingInformation.address, 60));
  billTo.setCity(compressedField(billingInformation.city, 40));
  billTo.setState(compressedField(billingInformation.state, 40));
  billTo.setZip(compressedField(billingInformation.zip, 20));
  billTo.setCountry(compressedField(billingInformation.country, 60));
  billTo.setPhoneNumber(compressedField(billingInformation.city, 25));

  const shipTo = new APIContracts.CustomerAddressType();
  shipTo.setFirstName(compressedField(mailingInformation.firstName, 50));
  shipTo.setLastName(compressedField(mailingInformation.lastName, 50));
  shipTo.setCompany(compressedField(mailingInformation.company, 50));
  shipTo.setAddress(compressedField(mailingInformation.address, 60));
  shipTo.setCity(compressedField(mailingInformation.city, 40));
  shipTo.setState(compressedField(mailingInformation.state, 40));
  shipTo.setZip(compressedField(mailingInformation.zip, 20));
  shipTo.setCountry(compressedField(mailingInformation.country, 60));

  const paymentCardInfo = new APIContracts.CreditCardType();
  paymentCardInfo.setCardNumber(
    compressedField(cardInformation.cardNumber, 16)
  );
  paymentCardInfo.setCardCode(compressedField(cardInformation.cardCode, 4));
  paymentCardInfo.setExpirationDate(
    compressedField(cardInformation.cardExpiration, 7)
  );

  const paymentType = new APIContracts.PaymentType();
  paymentType.setCreditCard(paymentCardInfo);

  const order = new APIContracts.OrderType();
  order.setInvoiceNumber(paymentID);
  order.setDescription(compressedField(`ID: ${courseID} | ${courseName}`, 255));

  const drivingSchoolIDField = new APIContracts.UserField();
  drivingSchoolIDField.setName("Driving School ID");
  drivingSchoolIDField.setValue(drivingSchoolCredentials.drivingSchoolID);

  const studentUserNameField = new APIContracts.UserField();
  studentUserNameField.setName("Student Username");
  studentUserNameField.setValue(accountInformation.userName);

  const userFields = new APIContracts.TransactionRequestType.UserFields();
  userFields.setUserField([drivingSchoolIDField, studentUserNameField]);

  const emailCustomerSetting = new APIContracts.SettingType();
  emailCustomerSetting.setSettingName("emailCustomer");
  emailCustomerSetting.setSettingValue("true");

  const transactionSettings = new APIContracts.ArrayOfSetting();
  transactionSettings.setSetting([emailCustomerSetting]);

  const transactionRequest = new APIContracts.TransactionRequestType();

  transactionRequest.setTransactionType(
    APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION
  );
  transactionRequest.setPayment(paymentType);
  transactionRequest.setAmount(finalChargeAmount);
  transactionRequest.setOrder(order);
  transactionRequest.setCustomer(customer);
  transactionRequest.setBillTo(billTo);
  transactionRequest.setShipTo(shipTo);
  transactionRequest.setUserFields(userFields);
  transactionRequest.setTransactionSettings(transactionSettings);

  const createRequest = new APIContracts.CreateTransactionRequest();
  createRequest.setMerchantAuthentication(merchantAuthentication);
  createRequest.setRefId(paymentID);
  createRequest.setTransactionRequest(transactionRequest);

  const transactionController = new APIControllers.CreateTransactionController(
    createRequest.getJSON()
  );

  return new Promise((resolve) => {
    transactionController.execute(() => {
      const response = transactionController.getResponse();
      resolve(response);
    });
  });
};

export default payment;
