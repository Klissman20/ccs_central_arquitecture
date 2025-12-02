const AWSMock = require("aws-sdk-mock");
const AWS = require("aws-sdk");

const {handler} = require("../services/getIncidentsByVehicle");

describe("getIncidentsByVehicle", () => {
  beforeAll(() => {
    AWSMock.setSDKInstance(AWS);

    AWSMock.mock("DynamoDB.DocumentClient", "query", (params, callback) => {
      callback(null, {Items: [{id: "1"}, {id: "2"}], Count: 2});
    });
  });

  afterAll(() => AWSMock.restore());

  test("Debe retornar historial de incidentes", async () => {
    const event = {
      pathParameters: {vehicleId: "VH-001"},
    };

    const result = await handler(event);

    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.count).toBe(1);
  });
});
