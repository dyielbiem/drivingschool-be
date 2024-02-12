import { S3Client } from "@aws-sdk/client-s3";

let client;

if (process.env.IS_OFFLINE) {
  client = new S3Client({
    forcePathStyle: true,
    credentials: {
      accessKeyId: "S3RVER",
      secretAccessKey: "S3RVER"
    },
    endpoint: "http://localhost:8001",
    region: "localhost"
  });
} else {
  client = new S3Client({});
}

const s3Client = client;

export default s3Client;
