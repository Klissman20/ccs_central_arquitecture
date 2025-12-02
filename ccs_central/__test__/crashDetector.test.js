const AWSMock = require("aws-sdk-mock");
const AWS = require("aws-sdk");

const {handler} = require("../services/crashDetector");

describe("crashDetector", () => {
  beforeAll(() => {
    AWSMock.setSDKInstance(AWS);

    AWSMock.mock("DynamoDB.DocumentClient", "put", (params, callback) => {
      callback(null, {});
    });

    AWSMock.mock("SNS", "publish", (params, callback) => {
      callback(null, {});
    });
  });

  afterAll(() => AWSMock.restore());

  test("Debe detectar un accidente", async () => {
    const event = {
      Records: [
        {
          kinesis: {
            data: Buffer.from(
              JSON.stringify({
                vehicle_id: "VH-99",
                previous_speed: 100,
                speed: 0,
                timestamp: new Date().toISOString(),
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
