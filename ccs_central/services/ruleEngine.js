// services/ruleEngine.js

/**
 * Evalúa reglas simples contra un alert/incident context.
 * Las reglas son objetos con:
 *   { rule_type: 'STOP_DURATION', threshold_value: 300, comparison_operator: '>' }
 *
 * Retorna array de acciones (por ejemplo: ['notify_owner', 'notify_authority'])
 */
function evaluateRules(rules = [], context = {}) {
  if (!Array.isArray(rules)) return [];

  const actions = [];
  for (const r of rules) {
    if (!r || !r.rule_type) continue;

    // ejemplo: regla STOP_DURATION se aplica sobre context.durationSec
    if (r.rule_type === "STOP_DURATION") {
      const dur = context.durationSec || 0;
      const threshold = Number(r.threshold_value || 0);
      const op = r.comparison_operator || ">";
      let matched = false;
      if (op === ">" && dur > threshold) matched = true;
      if (op === ">=" && dur >= threshold) matched = true;
      if (op === "<" && dur < threshold) matched = true;
      if (matched) {
        if (r.action) actions.push(r.action);
      }
    }

    // regla genérica: TEMPERATURE
    if (r.rule_type === "TEMPERATURE") {
      const temp = Number(context.temperature || 0);
      const threshold = Number(r.threshold_value || 0);
      if (temp > threshold && r.action) actions.push(r.action);
    }
  }

  return actions;
}

module.exports = {evaluateRules};
