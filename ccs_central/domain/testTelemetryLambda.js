const {handler} = require("../services/telemetryProcessor");

async function test() {
  const event = {
    Records: [
      {
        kinesis: {
          data: Buffer.from(
            JSON.stringify({
              vehicle_id: "VH-001",
              timestamp: new Date().toISOString(),
              speed: 90,
              previous_speed: 95,
              temperature: 85,
              fuel_level: 50,
              location: {lat: 6.2121, lng: -75.5812},
            }),
          ).toString("base64"),
        },
      },
    ],
  };

  const result = await handler(event);
  console.log(result);
}

test();
