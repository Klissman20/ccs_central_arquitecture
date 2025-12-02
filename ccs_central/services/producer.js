// services/producer.js
const {v4: uuidv4} = require("uuid");

/**
 * Simula validación y normalización del evento entrante,
 * y prepara el objeto que se enviaría al stream (Kinesis).
 */
function validateAndPrepareEvent(raw) {
  if (!raw || !raw.type || !raw.vehicleId) {
    throw new Error("InvalidEvent");
  }

  // normalize timestamps
  const ts = raw.ts || new Date().toISOString();

  const event = {
    id: raw.id || uuidv4(),
    vehicleId: raw.vehicleId,
    type: raw.type,
    ts,
    payload: raw.payload || {},
  };

  return event;
}

/**
 * Simula envío a stream (retorna el record object).
 */
async function enqueueToStream(streamClient, streamName, event) {
  // streamClient is a mockable client with putRecord method
  if (!streamClient || typeof streamClient.putRecord !== "function") {
    throw new Error("InvalidStreamClient");
  }
  const record = {
    streamName,
    partitionKey: event.vehicleId,
    data: event,
  };
  await streamClient.putRecord(record);
  return record;
}

module.exports = {
  validateAndPrepareEvent,
  enqueueToStream,
};
