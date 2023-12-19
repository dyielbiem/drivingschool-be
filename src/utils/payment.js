import authorizenet from "authorizenet";
import { decrypt } from "./crypto.js";

/*
---- Utility function to make a request to Authorize API Gateway 
---- to create a payment transaction
*/
const payment = (
  merchantInfo,
  paymentID,
  chargeAmount,
  studentInfo,
  cardInfo,
  courseName
) => {
  const APIContracts = authorizenet.APIContracts;
  const APIControllers = authorizenet.APIControllers;

  const decryptedPaymentLogInKey = decrypt(merchantInfo.loginKey);
  const decryptedPaymentTransactionKey = decrypt(merchantInfo.transactionKey);

  const merchantAuthentication = new APIContracts.MerchantAuthenticationType();
  merchantAuthentication.setName(decryptedPaymentLogInKey);
  merchantAuthentication.setTransactionKey(decryptedPaymentTransactionKey);

  const customer = new APIContracts.CustomerType();
  customer.setId(studentInfo.userName);
  customer.setEmail(studentInfo.email);

  const billAndShipTo = new APIContracts.CustomerAddressType();
  billAndShipTo.setFirstName(studentInfo.firstName);
  billAndShipTo.setLastName(studentInfo.lastName);
  billAndShipTo.setCompany(studentInfo.company);
  billAndShipTo.setAddress(studentInfo.address);
  billAndShipTo.setCity(studentInfo.city);
  billAndShipTo.setState(studentInfo.state);
  billAndShipTo.setZip(studentInfo.zip);
  billAndShipTo.setCountry(studentInfo.country);

  const paymentCardInfo = new APIContracts.CreditCardType();
  paymentCardInfo.setCardNumber(cardInfo.number);
  paymentCardInfo.setCardCode(cardInfo.code);
  paymentCardInfo.setExpirationDate(cardInfo.expiration);

  const paymentType = new APIContracts.PaymentType();
  paymentType.setCreditCard(paymentCardInfo);

  const order = new APIContracts.OrderType();
  order.setInvoiceNumber(paymentID);
  order.setDescription(courseName);

  const transactionRequest = new APIContracts.TransactionRequestType();

  transactionRequest.setTransactionType(
    APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION
  );
  transactionRequest.setPayment(paymentType);
  transactionRequest.setAmount(chargeAmount);
  transactionRequest.setOrder(order);
  transactionRequest.setCustomer(customer);
  transactionRequest.setBillTo(billAndShipTo);
  transactionRequest.setShipTo(billAndShipTo);

  const createRequest = new APIContracts.CreateTransactionRequest();
  createRequest.setMerchantAuthentication(merchantAuthentication);
  createRequest.setRefId(paymentID);
  createRequest.setTransactionRequest(transactionRequest);

  const transactionController = new APIControllers.CreateTransactionController(
    createRequest.getJSON()
  );

  return new Promise(async (resolve) => {
    await transactionController.execute(() => {
      const response = transactionController.getResponse();
      resolve(response);
    });
  });
};

export default payment;
