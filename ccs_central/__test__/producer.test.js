// __tests__/producer.test.js
const {validateAndPrepareEvent, enqueueToStream} = require("../services/producer");

describe("producer.validateAndPrepareEvent", () => {
  it("throws on invalid input", () => {
    expect(() => validateAndPrepareEvent(null)).toThrow("InvalidEvent");
    expect(() => validateAndPrepareEvent({type: "panic"})).toThrow("InvalidEvent");
  });

  it("creates normalized event when inputs ok", () => {
    const raw = {vehicleId: "v1", type: "panic", ts: "2025-01-01T00:00:00Z"};
    const ev = validateAndPrepareEvent(raw);
    expect(ev.vehicleId).toBe("v1");
    expect(ev.type).toBe("panic");
    expect(ev.ts).toBe("2025-01-01T00:00:00Z");
    expect(ev.id).toBeTruthy();
  });
});

describe("producer.enqueueToStream", () => {
  it("throws when invalid stream client", async () => {
    const ev = {vehicleId: "v1", id: "id1", ts: "t", type: "panic"};
    await expect(enqueueToStream(null, "s", ev)).rejects.toThrow("InvalidStreamClient");
  });

  it("calls putRecord on stream client", async () => {
    const putRecord = jest.fn().mockResolvedValue(true);
    const client = {putRecord};
    const ev = {vehicleId: "v1", id: "id1", ts: "t", type: "panic"};
    const record = await enqueueToStream(client, "panic-stream", ev);
    expect(putRecord).toHaveBeenCalled();
    expect(record.streamName).toBe("panic-stream");
    expect(record.partitionKey).toBe("v1");
  });
});
