window.__ModuleLoader__.load({ id: "dsh-tiered-model-router", factory: (require) => {
var module = { exports: {} };
var exports = module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.js
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react = __toESM(require("react"), 1);
var ROUTER_SETTINGS_NAMESPACE = "dsh-tiered-model-router";
var TIERS = ["easy", "standard", "hard"];
var TIER_LABELS = { easy: "Easy", standard: "Standard", hard: "Hard" };
var DEFAULT_ROUTE = { provider: "", model: "", reasoningEffort: "", maxTokens: "" };
var DEFAULT_POLICY = {
  defaultTier: "standard",
  preserveExplicitSelection: true,
  takeOverUnknownSelection: false,
  routeSubagents: false,
  standardAtStep: 2,
  hardAtStep: 3,
  hardAfterToolFailures: 2,
  standardAtChars: 500,
  hardAtChars: 2500,
  preserveMaxTokens: true,
  clearReasoningEffortWhenUnset: true,
  easyKeywords: [],
  standardKeywords: [],
  hardKeywords: [],
  hardTools: [],
  failureExclude: []
};
var POLICY_LIST_KEYS = ["easyKeywords", "standardKeywords", "hardKeywords", "hardTools", "failureExclude"];
var styles = {
  section: { display: "flex", flexDirection: "column", gap: 20, padding: "24px 28px", maxWidth: 920 },
  heading: { margin: 0, fontSize: 22, lineHeight: 1.25, fontWeight: 650, color: "var(--dsw-fg-primary, #1f2329)" },
  description: { margin: "6px 0 0", color: "var(--dsw-fg-secondary, #667085)", fontSize: 13, lineHeight: 1.5 },
  toolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" },
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 38 },
  label: { color: "var(--dsw-fg-primary, #1f2329)", fontSize: 14, lineHeight: 1.35 },
  hint: { color: "var(--dsw-fg-secondary, #667085)", fontSize: 12, lineHeight: 1.4 },
  group: { borderTop: "1px solid var(--dsw-border-subtle, #e5e7eb)", paddingTop: 18, display: "flex", flexDirection: "column", gap: 12 },
  groupTitle: { margin: 0, fontSize: 15, fontWeight: 620, color: "var(--dsw-fg-primary, #1f2329)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid var(--dsw-border-default, #d0d5dd)", borderRadius: 6, padding: "8px 10px", font: "inherit", color: "var(--dsw-fg-primary, #1f2329)", background: "var(--dsw-bg-input, #fff)" },
  textarea: { width: "100%", minHeight: 82, boxSizing: "border-box", border: "1px solid var(--dsw-border-default, #d0d5dd)", borderRadius: 6, padding: "8px 10px", font: "inherit", lineHeight: 1.4, resize: "vertical", color: "var(--dsw-fg-primary, #1f2329)", background: "var(--dsw-bg-input, #fff)" },
  select: { width: "100%", boxSizing: "border-box", border: "1px solid var(--dsw-border-default, #d0d5dd)", borderRadius: 6, padding: "8px 10px", font: "inherit", color: "var(--dsw-fg-primary, #1f2329)", background: "var(--dsw-bg-input, #fff)" },
  check: { display: "flex", alignItems: "flex-start", gap: 9, minHeight: 32 },
  actions: { display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, paddingTop: 4 },
  button: { border: "1px solid var(--dsw-border-default, #d0d5dd)", borderRadius: 6, padding: "8px 14px", font: "inherit", cursor: "pointer", background: "var(--dsw-bg-input, #fff)", color: "var(--dsw-fg-primary, #1f2329)" },
  primary: { background: "var(--dsw-accent, #2563eb)", borderColor: "var(--dsw-accent, #2563eb)", color: "#fff" },
  notice: { border: "1px solid var(--dsw-border-subtle, #e5e7eb)", borderRadius: 6, padding: "10px 12px", color: "var(--dsw-fg-secondary, #667085)", fontSize: 13, lineHeight: 1.45 },
  error: { borderColor: "#f2b8b5", background: "#fff7f6", color: "#9b1c1c" }
};
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function clone(value) {
  try {
    return structuredClone(value);
  } catch {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      if (Array.isArray(value)) return [...value];
      if (isRecord(value)) return { ...value };
      return value;
    }
  }
}
function listText(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string").join("\n");
  return typeof value === "string" ? value : "";
}
function parseList(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean);
  return String(value ?? "").split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
}
function draftFromValue(value) {
  const source = isRecord(value) ? value : {};
  const tiers = isRecord(source.tiers) ? source.tiers : {};
  const policy = isRecord(source.policy) ? source.policy : {};
  const result = {
    enabled: source.enabled !== false,
    tiers: {},
    policy: { ...DEFAULT_POLICY }
  };
  for (const tier of TIERS) {
    const route = isRecord(tiers[tier]) ? tiers[tier] : {};
    result.tiers[tier] = {
      ...DEFAULT_ROUTE,
      ...clone(route),
      provider: typeof route.provider === "string" ? route.provider : "",
      model: typeof route.model === "string" ? route.model : "",
      reasoningEffort: typeof route.reasoningEffort === "string" ? route.reasoningEffort : "",
      maxTokens: Number.isSafeInteger(route.maxTokens) && route.maxTokens >= 1 ? String(route.maxTokens) : ""
    };
  }
  for (const [key, fallback] of Object.entries(DEFAULT_POLICY)) {
    const candidate = policy[key];
    if (Array.isArray(fallback)) result.policy[key] = listText(candidate);
    else if (typeof fallback === "boolean") result.policy[key] = typeof candidate === "boolean" ? candidate : fallback;
    else if (key === "defaultTier") result.policy[key] = TIERS.includes(candidate) ? candidate : fallback;
    else result.policy[key] = Number.isSafeInteger(candidate) && candidate >= 1 ? candidate : fallback;
  }
  for (const [key, candidate] of Object.entries(policy)) {
    if (!(key in result.policy)) result.policy[key] = clone(candidate);
  }
  return result;
}
function numberOrFallback(value, fallback) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 1 ? number : fallback;
}
function routeValue(route) {
  const result = isRecord(route) ? clone(route) : {};
  result.provider = String(route.provider ?? "").trim();
  result.model = String(route.model ?? "").trim();
  const effort = String(route.reasoningEffort ?? "").trim();
  if (effort) result.reasoningEffort = effort;
  else delete result.reasoningEffort;
  const maxTokens = numberOrFallback(route.maxTokens, 0);
  if (maxTokens > 0) result.maxTokens = maxTokens;
  else delete result.maxTokens;
  return result;
}
function valueForSave(draft) {
  const policy = { ...draft.policy };
  policy.standardAtStep = numberOrFallback(policy.standardAtStep, DEFAULT_POLICY.standardAtStep);
  policy.hardAtStep = numberOrFallback(policy.hardAtStep, DEFAULT_POLICY.hardAtStep);
  policy.hardAfterToolFailures = numberOrFallback(policy.hardAfterToolFailures, DEFAULT_POLICY.hardAfterToolFailures);
  policy.standardAtChars = numberOrFallback(policy.standardAtChars, DEFAULT_POLICY.standardAtChars);
  policy.hardAtChars = numberOrFallback(policy.hardAtChars, DEFAULT_POLICY.hardAtChars);
  if (policy.hardAtChars < policy.standardAtChars) policy.hardAtChars = policy.standardAtChars;
  if (policy.hardAtStep < policy.standardAtStep) policy.hardAtStep = policy.standardAtStep;
  for (const key of POLICY_LIST_KEYS) policy[key] = parseList(policy[key]);
  return {
    enabled: Boolean(draft.enabled),
    tiers: Object.fromEntries(TIERS.map((tier) => [tier, routeValue(draft.tiers[tier])])),
    policy
  };
}
function operationsForDraft(draft) {
  const next = valueForSave(draft);
  const operations = [
    { op: "set", path: ["enabled"], value: next.enabled }
  ];
  for (const tier of TIERS) {
    const raw = draft.tiers[tier] ?? DEFAULT_ROUTE;
    operations.push(
      { op: "set", path: ["tiers", tier, "provider"], value: next.tiers[tier].provider },
      { op: "set", path: ["tiers", tier, "model"], value: next.tiers[tier].model }
    );
    const effort = String(raw.reasoningEffort ?? "").trim();
    operations.push(effort ? { op: "set", path: ["tiers", tier, "reasoningEffort"], value: effort } : { op: "unset", path: ["tiers", tier, "reasoningEffort"] });
    const maxTokens = numberOrFallback(raw.maxTokens, 0);
    operations.push(maxTokens > 0 ? { op: "set", path: ["tiers", tier, "maxTokens"], value: maxTokens } : { op: "unset", path: ["tiers", tier, "maxTokens"] });
  }
  for (const [key, fieldValue] of Object.entries(next.policy)) {
    operations.push({ op: "set", path: ["policy", key], value: fieldValue });
  }
  return operations;
}
function setNested(previous, path, value) {
  const next = clone(previous);
  let cursor = next;
  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index];
    if (!isRecord(cursor[key])) cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[path[path.length - 1]] = value;
  return next;
}
function field(props, label, value, onChange, type = "text", extra = {}) {
  return import_react.default.createElement(
    "label",
    { style: styles.field, key: props },
    import_react.default.createElement("span", { style: styles.hint }, label),
    import_react.default.createElement("input", {
      ...extra,
      style: styles.input,
      type,
      value: value ?? "",
      onChange
    })
  );
}
function listField(key, label, value, onChange, placeholder, disabled) {
  return import_react.default.createElement(
    "label",
    { style: styles.field, key },
    import_react.default.createElement("span", { style: styles.hint }, label),
    import_react.default.createElement("textarea", {
      style: styles.textarea,
      value: value ?? "",
      onChange,
      placeholder,
      disabled,
      spellCheck: false
    })
  );
}
function checkbox(key, label, checked, onChange, hint, disabled = false) {
  return import_react.default.createElement(
    "label",
    { key, style: styles.check },
    import_react.default.createElement("input", { type: "checkbox", checked: Boolean(checked), onChange, disabled, style: { marginTop: 3 } }),
    import_react.default.createElement(
      "span",
      null,
      import_react.default.createElement("span", { style: styles.label }, label),
      hint ? import_react.default.createElement("div", { style: styles.hint }, hint) : null
    )
  );
}
function RouteEditor({ tier, route, onChange, disabled }) {
  const update = (key) => (event) => onChange(key, event.target.value);
  return import_react.default.createElement(
    "div",
    { style: styles.group, key: tier },
    import_react.default.createElement("h3", { style: styles.groupTitle }, TIER_LABELS[tier]),
    import_react.default.createElement(
      "div",
      { style: styles.grid },
      field(`${tier}-provider`, "Provider", route.provider, update("provider"), "text", { placeholder: "\u4F8B\u5982 openai", disabled }),
      field(`${tier}-model`, "Model", route.model, update("model"), "text", { placeholder: "\u4F8B\u5982 dsh-fast", disabled }),
      field(`${tier}-effort`, "Reasoning effort", route.reasoningEffort, update("reasoningEffort"), "text", { placeholder: "low / medium / high", disabled }),
      field(`${tier}-tokens`, "Max tokens\uFF08\u53EF\u9009\uFF09", route.maxTokens, update("maxTokens"), "number", { min: 1, step: 1, placeholder: "\u7559\u7A7A\u8868\u793A\u6CBF\u7528", disabled })
    )
  );
}
function PolicyEditor({ policy, onChange, disabled }) {
  const set = (key) => (event) => onChange(key, event.target.type === "checkbox" ? event.target.checked : event.target.value);
  return import_react.default.createElement(
    "div",
    { style: styles.group },
    import_react.default.createElement("h3", { style: styles.groupTitle }, "Routing policy"),
    import_react.default.createElement(
      "div",
      { style: styles.grid },
      import_react.default.createElement(
        "label",
        { style: styles.field },
        import_react.default.createElement("span", { style: styles.hint }, "Default tier"),
        import_react.default.createElement(
          "select",
          { style: styles.select, value: policy.defaultTier, onChange: set("defaultTier"), disabled },
          TIERS.map((tier) => import_react.default.createElement("option", { key: tier, value: tier }, TIER_LABELS[tier]))
        )
      ),
      field("standard-step", "Standard at step", policy.standardAtStep, set("standardAtStep"), "number", { min: 1, step: 1, disabled }),
      field("hard-step", "Hard at step", policy.hardAtStep, set("hardAtStep"), "number", { min: 1, step: 1, disabled }),
      field("tool-failures", "Hard after tool failures", policy.hardAfterToolFailures, set("hardAfterToolFailures"), "number", { min: 1, step: 1, disabled }),
      field("standard-chars", "Standard at characters", policy.standardAtChars, set("standardAtChars"), "number", { min: 1, step: 1, disabled }),
      field("hard-chars", "Hard at characters", policy.hardAtChars, set("hardAtChars"), "number", { min: 1, step: 1, disabled })
    ),
    import_react.default.createElement(
      "div",
      { style: { display: "grid", gap: 8 } },
      checkbox("preserve-explicit", "\u4FDD\u7559\u624B\u52A8\u9009\u62E9\u7684\u6A21\u578B", policy.preserveExplicitSelection, set("preserveExplicitSelection"), "\u8BC6\u522B\u5230\u7528\u6237\u624B\u52A8\u6307\u5B9A\u7684 provider/model \u65F6\u4E0D\u63A5\u7BA1\u3002", disabled),
      checkbox("take-over-unknown", "\u63A5\u7BA1\u672A\u77E5\u7684\u624B\u52A8\u6A21\u578B", policy.takeOverUnknownSelection, set("takeOverUnknownSelection"), "\u5173\u95ED\u65F6\uFF0C\u672A\u77E5\u6A21\u578B\u7EE7\u7EED\u7531\u7528\u6237\u9009\u62E9\u3002", disabled),
      checkbox("subagents", "\u8DEF\u7531\u5B50\u4EE3\u7406", policy.routeSubagents, set("routeSubagents"), void 0, disabled),
      checkbox("preserve-max", "\u4FDD\u7559\u624B\u52A8 max tokens", policy.preserveMaxTokens, set("preserveMaxTokens"), void 0, disabled),
      checkbox("clear-effort", "\u672A\u914D\u7F6E reasoning effort \u65F6\u6E05\u9664\u65E7\u503C", policy.clearReasoningEffortWhenUnset, set("clearReasoningEffortWhenUnset"), void 0, disabled)
    ),
    import_react.default.createElement(
      "div",
      { style: styles.group },
      import_react.default.createElement("h3", { style: styles.groupTitle }, "Matching lists"),
      import_react.default.createElement("p", { style: styles.hint }, "\u6BCF\u884C\u4E00\u4E2A\uFF0C\u4E5F\u53EF\u4EE5\u7528\u9017\u53F7\u5206\u9694\uFF1B\u7559\u7A7A\u8868\u793A\u5173\u95ED\u8BE5\u7C7B\u5339\u914D\u3002"),
      import_react.default.createElement(
        "div",
        { style: styles.grid },
        listField("easy-keywords", "Easy keywords", policy.easyKeywords, set("easyKeywords"), "\u4F8B\u5982\uFF1Ahello\n\u7FFB\u8BD1", disabled),
        listField("standard-keywords", "Standard keywords", policy.standardKeywords, set("standardKeywords"), "\u4F8B\u5982\uFF1Acode\n\u6587\u4EF6", disabled),
        listField("hard-keywords", "Hard keywords", policy.hardKeywords, set("hardKeywords"), "\u4F8B\u5982\uFF1Aproduction\n\u8FC1\u79FB", disabled),
        listField("hard-tools", "Hard tools", policy.hardTools, set("hardTools"), "\u4F8B\u5982\uFF1Aapply_patch\nshell", disabled),
        listField("failure-exclude", "Ignored tool failures", policy.failureExclude, set("failureExclude"), "\u4F8B\u5982\uFF1Atodo_write", disabled)
      )
    )
  );
}
function TieredRouterSection(props) {
  const { scope, useSnapshot } = props;
  if (!scope || typeof useSnapshot !== "function") return null;
  const snapshot = useSnapshot((value2) => value2);
  const value = snapshot?.value;
  const fallbackValue = isRecord(snapshot?.base) ? snapshot.base : void 0;
  const resolvedValue = isRecord(value) ? value : fallbackValue;
  const ready = snapshot?.status === "ready" && isRecord(value);
  const writable = snapshot?.writable === true;
  const editable = ready && writable;
  const resettable = writable && isRecord(resolvedValue) && (typeof scope.mutate === "function" || typeof scope.replace === "function");
  const [draft, setDraft] = (0, import_react.useState)(() => draftFromValue(resolvedValue));
  const [dirty, setDirty] = (0, import_react.useState)(false);
  const [saving, setSaving] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)("");
  (0, import_react.useEffect)(() => {
    if (!dirty && resolvedValue) setDraft(draftFromValue(resolvedValue));
  }, [value, fallbackValue, resolvedValue, dirty]);
  const changed = (path, nextValue) => {
    setDraft((previous) => setNested(previous, path, nextValue));
    setDirty(true);
    setError("");
  };
  const reset = () => {
    setDraft(draftFromValue(resolvedValue));
    setDirty(false);
    setError("");
  };
  const save = async () => {
    if (saving || !editable) return;
    const invalidTier = TIERS.find((tier) => !String(draft.tiers[tier]?.provider ?? "").trim() || !String(draft.tiers[tier]?.model ?? "").trim());
    if (invalidTier) {
      setError(`${TIER_LABELS[invalidTier]} requires both Provider and Model`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const operations = operationsForDraft(draft);
      if (typeof scope.mutate === "function") {
        await scope.mutate(operations);
      } else if (typeof scope.replace === "function") {
        await scope.replace(valueForSave(draft));
      } else {
        throw new Error("\u5F53\u524D DSH \u7248\u672C\u4E0D\u652F\u6301\u8BBE\u7F6E\u5199\u5165");
      }
      setDirty(false);
    } catch (saveError) {
      setError(String(saveError?.message ?? saveError ?? "\u4FDD\u5B58\u5931\u8D25"));
    } finally {
      setSaving(false);
    }
  };
  const resetAll = async () => {
    if (saving || !resettable) return;
    setSaving(true);
    setError("");
    try {
      if (typeof scope.mutate === "function") await scope.mutate([{ op: "unset", path: [] }]);
      else await scope.replace({});
      setDirty(false);
    } catch (resetError) {
      setError(String(resetError?.message ?? resetError ?? "\u91CD\u7F6E\u5931\u8D25"));
    } finally {
      setSaving(false);
    }
  };
  const statusNotice = (0, import_react.useMemo)(() => {
    if (snapshot?.status === "loading") return "\u6B63\u5728\u8BFB\u53D6 DSH \u8BBE\u7F6E\u2026";
    if (snapshot?.status === "unavailable") return "\u5F53\u524D\u8FD0\u884C\u6A21\u5F0F\u6CA1\u6709\u53EF\u5199\u7684 DSH Settings \u670D\u52A1\uFF1B\u9875\u9762\u4FDD\u6301\u53EA\u8BFB\u3002";
    if (!ready && fallbackValue) return "\u6301\u4E45\u5316\u8BBE\u7F6E\u4E0D\u53EF\u7528\uFF0C\u5F53\u524D\u663E\u793A\u7EC4\u5408\u914D\u7F6E\uFF1B\u53EF\u6062\u590D\u7EC4\u5408\u914D\u7F6E\u6765\u6E05\u9664\u7528\u6237\u8986\u76D6\u3002";
    if (!ready) return "\u914D\u7F6E\u5C1A\u672A\u5C31\u7EEA\uFF0C\u6682\u65F6\u4E0D\u4F1A\u4FEE\u6539\u6A21\u578B\u8DEF\u7531\u3002";
    if (!writable) return "\u5F53\u524D DSH Settings \u4E3A\u53EA\u8BFB\uFF0C\u9875\u9762\u4EC5\u4F9B\u67E5\u770B\u3002";
    return "";
  }, [snapshot?.status, ready, fallbackValue, writable]);
  return import_react.default.createElement(
    "div",
    { style: styles.section },
    import_react.default.createElement(
      "div",
      null,
      import_react.default.createElement("h2", { style: styles.heading }, "\u6A21\u578B\u8DEF\u7531"),
      import_react.default.createElement("p", { style: styles.description }, "\u6839\u636E\u4EFB\u52A1\u96BE\u5EA6\u5728 Easy\u3001Standard\u3001Hard \u4E09\u6863\u4E4B\u95F4\u81EA\u52A8\u5207\u6362\u6A21\u578B\u3002\u6A21\u578B\u540D\u79F0\u548C Provider \u5B8C\u5168\u7531\u4F60\u914D\u7F6E\u3002")
    ),
    statusNotice ? import_react.default.createElement("div", { style: styles.notice }, statusNotice) : null,
    error ? import_react.default.createElement("div", { style: { ...styles.notice, ...styles.error }, role: "alert" }, error) : null,
    import_react.default.createElement(
      "div",
      { style: styles.toolbar },
      checkbox("enabled", "\u542F\u7528\u81EA\u52A8\u6A21\u578B\u8DEF\u7531", draft.enabled, (event) => changed(["enabled"], event.target.checked), "\u5173\u95ED\u540E\u4FDD\u7559\u8BBE\u7F6E\uFF0C\u4F46\u8BF7\u6C42\u76F4\u63A5\u6CBF\u7528 DSH \u5F53\u524D\u6A21\u578B\u3002", !editable),
      dirty ? import_react.default.createElement("span", { style: styles.hint }, "\u6709\u672A\u4FDD\u5B58\u7684\u4FEE\u6539") : null
    ),
    TIERS.map((tier) => import_react.default.createElement(RouteEditor, {
      key: tier,
      tier,
      route: draft.tiers[tier],
      disabled: !editable,
      onChange: (key, next) => changed(["tiers", tier, key], next)
    })),
    import_react.default.createElement(PolicyEditor, {
      policy: draft.policy,
      disabled: !editable,
      onChange: (key, next) => changed(["policy", key], next)
    }),
    import_react.default.createElement(
      "div",
      { style: styles.actions },
      import_react.default.createElement("button", { type: "button", style: styles.button, onClick: reset, disabled: saving || !dirty }, "\u653E\u5F03\u4FEE\u6539"),
      import_react.default.createElement("button", { type: "button", style: styles.button, onClick: resetAll, disabled: saving || !resettable }, "\u6062\u590D\u7EC4\u5408\u914D\u7F6E"),
      import_react.default.createElement("button", { type: "button", style: { ...styles.button, ...styles.primary }, onClick: save, disabled: saving || !editable || !dirty }, saving ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58")
    )
  );
}
var inject = ["slots", "settingsScope"];
function apply(ctx) {
  let scope;
  try {
    scope = ctx.settingsScope.bind({ namespace: ROUTER_SETTINGS_NAMESPACE });
  } catch (error) {
    try {
      ctx.logger?.warn?.(`dsh-tiered-model-router settings UI unavailable: ${String(error?.message ?? error)}`);
    } catch {
    }
    return;
  }
  const injected = () => ({ scope, hooks: { snapshot: scope } });
  try {
    ctx.slots.inject("settings.section", () => ctx.slots.register({
      name: "settings.section",
      id: "tiered-model-router",
      order: 20,
      label: () => "\u6A21\u578B\u8DEF\u7531",
      inject: injected
    }, TieredRouterSection));
  } catch (error) {
    try {
      ctx.logger?.warn?.(`dsh-tiered-model-router settings section unavailable: ${String(error?.message ?? error)}`);
    } catch {
    }
  }
}

return module.exports;
} });
