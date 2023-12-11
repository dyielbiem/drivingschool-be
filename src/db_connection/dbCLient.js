import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

let dynamoClientParams = new DynamoDBClient({});

if (process.env.IS_OFFLINE) {
  dynamoClientParams = new DynamoDBClient({
    region: "localhost",
    endpoint: "http://0.0.0.0:8000",
  });
}

const dynamoClient = DynamoDBDocumentClient.from(dynamoClientParams);

export default dynamoClient;
