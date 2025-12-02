const {handler} = require("../services/getIncidentsByVehicle");

async function test() {
  const event = {
    pathParameters: {
      vehicleId: "VH-777",
    },
  };

  const result = await handler(event);
  console.log("Historial:", result.body);
}

test();
