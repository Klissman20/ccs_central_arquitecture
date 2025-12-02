const AWSMock = require("aws-sdk-mock");
const AWS = require("aws-sdk");

const {handler} = require("../services/panicProcessor");

describe("panicProcessor", () => {
  beforeAll(() => {
    AWSMock.setSDKInstance(AWS);

    AWSMock.mock("DynamoDB.DocumentClient", "put", (params, callback) => {
      callback(null, {});
    });

    AWSMock.mock("SNS", "publish", (params, callback) => {
      callback(null, {MessageId: "123"});
    });
  });

  afterAll(() => {
    AWSMock.restore();
  });

  test("Debe guardar un incidente y enviar notificación", async () => {
    const event = {
      Records: [
        {
          kinesis: {
            data: Buffer.from(
              JSON.stringify({
                incident_id: "INC-1",
                vehicle_id: "VH-1",
                driver_id: "DR-1",
                type: "PANIC_BUTTON",
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
