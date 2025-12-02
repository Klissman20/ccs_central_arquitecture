const {handler} = require("../services/crashDetector");

async function test() {
  const event = {
    Records: [
      {
        kinesis: {
          data: Buffer.from(
            JSON.stringify({
              vehicle_id: "VH-999",
              previous_speed: 100,
              speed: 0,
              timestamp: new Date().toISOString(),
              location: {lat: 6.35, lng: -75.45},
            }),
          ).toString("base64"),
        },
      },
    ],
  };

  const result = await handler(event);

  console.log("Resultado:", result);
}

test();
