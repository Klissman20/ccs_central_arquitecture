// __tests__/ruleEngine.test.js
const {evaluateRules} = require("../services/ruleEngine");

describe("ruleEngine.evaluateRules", () => {
  it("returns empty array for invalid rules", () => {
    expect(evaluateRules(null, {})).toEqual([]);
    expect(evaluateRules([], {})).toEqual([]);
  });

  it("evaluates STOP_DURATION rule correctly", () => {
    const rules = [
      {rule_type: "STOP_DURATION", threshold_value: 300, comparison_operator: ">", action: "notify_owner"},
    ];
    const ctx = {durationSec: 400};
    const actions = evaluateRules(rules, ctx);
    expect(actions).toContain("notify_owner");
  });

  it("does not match if below threshold", () => {
    const rules = [
      {rule_type: "STOP_DURATION", threshold_value: 300, comparison_operator: ">", action: "notify_owner"},
    ];
    const ctx = {durationSec: 100};
    const actions = evaluateRules(rules, ctx);
    expect(actions.length).toBe(0);
  });

  it("evaluates TEMPERATURE rule", () => {
    const rules = [{rule_type: "TEMPERATURE", threshold_value: 70, action: "notify_owner"}];
    const ctx = {temperature: 80};
    const actions = evaluateRules(rules, ctx);
    expect(actions).toContain("notify_owner");
  });
});
