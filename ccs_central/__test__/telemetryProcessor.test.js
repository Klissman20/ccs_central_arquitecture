const AWSMock = require("aws-sdk-mock");
const AWS = require("aws-sdk");

const {handler} = require("../services/telemetryProcessor");

describe("telemetryProcessor", () => {
  beforeAll(() => {
    AWSMock.setSDKInstance(AWS);
    AWSMock.mock("DynamoDB.DocumentClient", "put", (params, callback) => {
      callback(null, {});
    });
  });

  afterAll(() => AWSMock.restore());

  test("Debe guardar telemetría en DynamoDB", async () => {
    const event = {
      Records: [
        {
          kinesis: {
            data: Buffer.from(
              JSON.stringify({
                vehicle_id: "VH-2",
                timestamp: new Date().toISOString(),
                speed: 100,
                temperature: 85,
                fuel_level: 55,
                location: {lat: 1, lng: 1},
              }),
            ).toString("base64"),
          },
        },
      ],
    };

    const result = await handler(event);
    expect(result.statusCode).toBe(200);
  });
});
