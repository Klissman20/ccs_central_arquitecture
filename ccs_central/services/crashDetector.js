const AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
  accessKeyId: "test",
  secretAccessKey: "test",
  endpoint: "http://localhost:4566",
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

const INCIDENT_TABLE = "Incident";
const SNS_TOPIC_ARN = "arn:aws:sns:us-east-1:000000000000:emergency-dispatch";

exports.handler = async event => {
  for (const record of event.Records) {
    const payload = Buffer.from(record.kinesis.data, "base64").toString("utf-8");
    const data = JSON.parse(payload);

    // Regla básica: velocidad > 80 y baja a 0 en instante
    if (data.speed <= 5 && data.previous_speed >= 80) {
      const incident = {
        vehicle_id: data.vehicle_id,
        incident_id: "CRASH-" + Date.now(),
        type: "AUTO_CRASH",
        timestamp: data.timestamp,
        location: data.location,
      };

      await dynamoDB
        .put({
          TableName: INCIDENT_TABLE,
          Item: incident,
        })
        .promise();

      await sns
        .publish({
          TopicArn: SNS_TOPIC_ARN,
          Message: JSON.stringify({message: "Accidente detectado automáticamente", incident}),
          Subject: "CRASH DETECTED",
        })
        .promise();

      console.log("Accidente detectado automáticamente");
    }
  }

  return {statusCode: 200};
};
