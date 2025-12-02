// __tests__/notification.test.js
const {sendNotifications} = require("../services/notification");

describe("notification.sendNotifications", () => {
  it("throws with invalid client", async () => {
    await expect(sendNotifications(null, ["notify_owner"], {})).rejects.toThrow("InvalidNotificationClient");
  });

  it("returns empty array when no actions", async () => {
    const client = {send: jest.fn()};
    const res = await sendNotifications(client, [], {});
    expect(res).toEqual([]);
  });

  it("sends notifications for actions", async () => {
    const client = {send: jest.fn().mockResolvedValue("OK")};
    const actions = ["notify_owner", "notify_authority"];
    const results = await sendNotifications(client, actions, {incident: {incident_id: "i1"}});
    expect(client.send).toHaveBeenCalledTimes(2);
    expect(results[0].status).toBe("OK");
  });
});
