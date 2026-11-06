## Frontend Repository

[Driving School Frontend Repository](https://github.com/dyielbiem/drivingschool-fe)

## Minimum Requirements

- Java v21.0.1
- Node v18.18.2
- NPM v9.8.1

## Installation

Install dependencies with:

```
npm install
```

## For local development

You can emulate DynamoDB, API Gateway and Lambda locally by running:

```
npm run local
```

Your local API endpoint will be available at:

```
http://localhost:5000/
```

## Deployment

Run the command:

```
serverless deploy --stage [env_name]
```
