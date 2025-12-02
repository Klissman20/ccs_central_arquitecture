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
  const data = JSON.parse(event.body);

  const incident = {
    vehicle_id: data.vehicle_id,
    incident_id: "MECH-" + Date.now(),
    type: "MECHANICAL_FAILURE",
    timestamp: new Date().toISOString(),
    location: data.location,
  };

  await dynamoDB.put({TableName: INCIDENT_TABLE, Item: incident}).promise();

  await sns
    .publish({
      TopicArn: SNS_TOPIC_ARN,
      Message: JSON.stringify({message: "Falla mecánica reportada", incident}),
      Subject: "MECHANICAL ALERT",
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify({message: "Solicitud enviada"}),
  };
};
