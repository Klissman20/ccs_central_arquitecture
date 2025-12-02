const AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
  accessKeyId: "test",
  secretAccessKey: "test",
  endpoint: "http://localhost:4566",
});

const kinesis = new AWS.Kinesis();

async function sendPanic() {
  const data = {
    incident_id: "INC-" + Date.now(),
    vehicle_id: "VH-001",
    driver_id: "DR-100",
    type: "PANIC_BUTTON",
    timestamp: new Date().toISOString(),
    location: {
      lat: 6.2518,
      lng: -75.5636,
    },
  };

  const result = await kinesis
    .putRecord({
      StreamName: "panic-stream",
      PartitionKey: data.vehicle_id,
      Data: JSON.stringify(data),
    })
    .promise();

  console.log("Evento de pánico enviado:", result);
}

sendPanic();
