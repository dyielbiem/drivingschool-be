import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const invokeFunction = async (args) => {
  const { invokePath, headers, method, body } = args;
  const lambdaClient = new LambdaClient(
    process.env.IS_OFFLINE
      ? {
          endpoint: "http://localhost:3002"
        }
      : {}
  );

  const invokeCommand = new InvokeCommand({
    FunctionName: `${process.env.STAGE}-driving-school-backend-api`,
    InvocationType: "Event",
    Payload: JSON.stringify({
      path: invokePath,
      httpMethod: method,
      headers,
      body: JSON.stringify(body)
    })
  });

  const result = await lambdaClient.send(invokeCommand);
  return result;
};

export default invokeFunction;
