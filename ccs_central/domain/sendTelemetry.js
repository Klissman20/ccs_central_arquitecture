const AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
  accessKeyId: "test",
  secretAccessKey: "test",
  endpoint: "http://localhost:4566",
});

const kinesis = new AWS.Kinesis();

async function sendTelemetry() {
  const data = {
    vehicle_id: "VH-001",
    timestamp: new Date().toISOString(),
    speed: 90,
    previous_speed: 95,
    temperature: 85,
    fuel_level: 50,
    location: {lat: 6.2121, lng: -75.5812},
  };

  const response = await kinesis
    .putRecord({
      StreamName: "telemetry-stream",
      PartitionKey: data.vehicle_id,
      Data: JSON.stringify(data),
    })
    .promise();

  console.log("Telemetría enviada:", response);
}

sendTelemetry();
