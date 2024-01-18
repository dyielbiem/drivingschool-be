import authorizenet from "authorizenet";
import { decrypt } from "./crypto.js";

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
  courseInformation,
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
  customer.setId(accountInformation.userName);
  customer.setEmail(billingInformation.email);
  customer.setType("individual");

  const billTo = new APIContracts.CustomerAddressType();
  billTo.setFirstName(billingInformation.firstName);
  billTo.setLastName(billingInformation.lastName);
  billTo.setCompany(billingInformation.company);
  billTo.setAddress(billingInformation.address);
  billTo.setCity(billingInformation.city);
  billTo.setState(billingInformation.state);
  billTo.setZip(billingInformation.zip);
  billTo.setCountry(billingInformation.country);
  billTo.setPhoneNumber(billingInformation.phoneNumber);

  const shipTo = new APIContracts.CustomerAddressType();
  shipTo.setFirstName(mailingInformation.firstName);
  shipTo.setLastName(mailingInformation.lastName);
  shipTo.setCompany(mailingInformation.company);
  shipTo.setAddress(mailingInformation.address);
  shipTo.setCity(mailingInformation.city);
  shipTo.setState(mailingInformation.state);
  shipTo.setZip(mailingInformation.zip);
  shipTo.setCountry(mailingInformation.country);

  const paymentCardInfo = new APIContracts.CreditCardType();
  paymentCardInfo.setCardNumber(cardInformation.cardNumber);
  paymentCardInfo.setCardCode(cardInformation.cardCode);
  paymentCardInfo.setExpirationDate(cardInformation.cardExpiration);

  const paymentType = new APIContracts.PaymentType();
  paymentType.setCreditCard(paymentCardInfo);

  const order = new APIContracts.OrderType();
  order.setInvoiceNumber(paymentID);
  order.setDescription(courseInformation.courseName);

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
