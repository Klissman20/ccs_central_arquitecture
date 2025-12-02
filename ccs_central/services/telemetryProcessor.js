const AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
  accessKeyId: "test",
  secretAccessKey: "test",
  endpoint: "http://localhost:4566",
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

const TELEMETRY_TABLE = "Telemetry";

exports.handler = async event => {
  console.log("Evento telemetría recibido:", JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const payload = Buffer.from(record.kinesis.data, "base64").toString("utf-8");
    const data = JSON.parse(payload);

    const telemetry = {
      vehicle_id: data.vehicle_id,
      timestamp: data.timestamp,
      speed: data.speed,
      temperature: data.temperature,
      fuel_level: data.fuel_level,
      location: data.location,
    };

    await dynamoDB
      .put({
        TableName: TELEMETRY_TABLE,
        Item: telemetry,
      })
      .promise();

    console.log("Telemetría guardada");
  }

  return {statusCode: 200, body: "Telemetría procesada"};
};
