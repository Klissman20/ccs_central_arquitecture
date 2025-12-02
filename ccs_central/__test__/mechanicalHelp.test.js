const AWSMock = require("aws-sdk-mock");
const AWS = require("aws-sdk");

const {handler} = require("../services/mechanicalHelp");

describe("mechanicalHelp", () => {
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

  test("Debe generar una solicitud de ayuda mecánica", async () => {
    const event = {
      body: JSON.stringify({
        vehicle_id: "VH-777",
        location: {lat: 1, lng: 1},
      }),
    };

    const result = await handler(event);

    expect(result.statusCode).toBe(200);
  });
});
