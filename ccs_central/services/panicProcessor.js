const AWS = require("aws-sdk");

// Config para LocalStack (si lo llevas a AWS real luego solo quitas endpoint)
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
  console.log("Evento recibido desde Kinesis:", JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    // Kinesis envía datos en base64
    const payload = Buffer.from(record.kinesis.data, "base64").toString("utf-8");
    const data = JSON.parse(payload);

    console.log("Datos procesados:", data);

    // 1️⃣ Guardar en DynamoDB
    const incident = {
      vehicle_id: data.vehicle_id,
      incident_id: data.incident_id,
      driver_id: data.driver_id,
      type: data.type,
      timestamp: data.timestamp,
      location: data.location,
    };

    await dynamoDB
      .put({
        TableName: INCIDENT_TABLE,
        Item: incident,
      })
      .promise();

    console.log("Incidente guardado en DynamoDB");

    // 2️⃣ Enviar notificación SNS
    const notification = {
      Subject: "EMERGENCIA VEHICULAR",
      Message: JSON.stringify({
        message: "Emergencia detectada",
        incident: incident,
      }),
    };

    await sns
      .publish({
        TopicArn: SNS_TOPIC_ARN,
        Message: notification.Message,
        Subject: notification.Subject,
      })
      .promise();

    console.log("Notificación enviada a SNS");
  }

  return {statusCode: 200, body: "Procesado"};
};
