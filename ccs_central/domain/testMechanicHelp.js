const {handler} = require("../services/mechanicalHelp");

async function test() {
  const event = {
    body: JSON.stringify({
      vehicle_id: "VH-777",
      location: {lat: 6.13, lng: -75.22},
    }),
  };

  const result = await handler(event);

  console.log("Resultado:", result);
}

test();
