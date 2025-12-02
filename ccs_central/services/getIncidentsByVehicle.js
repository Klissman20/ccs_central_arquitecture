const AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
  accessKeyId: "test",
  secretAccessKey: "test",
  endpoint: "http://localhost:4566",
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async event => {
  console.log("Evento recibido:", JSON.stringify(event, null, 2));

  // ✅ Verificación segura
  if (!event.pathParameters || !event.pathParameters.vehicleId) {
    return {
      statusCode: 400,
      body: JSON.stringify({error: "vehicleId es requerido"}),
    };
  }

  const vehicleId = event.pathParameters.vehicleId;

  const params = {
    TableName: "Incident",
    KeyConditionExpression: "vehicle_id = :v",
    ExpressionAttributeValues: {
      ":v": vehicleId,
    },
  };

  const result = await dynamoDB.query(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({
      vehicleId,
      incidents: result.Items,
      count: result.Count,
    }),
  };
};
