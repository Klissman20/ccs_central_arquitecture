const {handler} = require("../services/panicProcessor");

async function test() {
  const event = {
    Records: [
      {
        kinesis: {
          data: Buffer.from(
            JSON.stringify({
              incident_id: "INC-" + Date.now(),
              vehicle_id: "VH-001",
              driver_id: "DR-100",
              type: "PANIC_BUTTON",
              timestamp: new Date().toISOString(),
              location: {lat: 6.25, lng: -75.56},
            }),
          ).toString("base64"),
        },
      },
    ],
  };

  const response = await handler(event);
  console.log(response);
}

test();
