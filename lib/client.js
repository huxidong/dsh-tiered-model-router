window.__ModuleLoader__.load({ id: "dsh-tiered-model-router", factory: (require) => {
var module = { exports: {} };
var exports = module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
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
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/client/index.js
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react = __toESM(require("react"), 1);
var ROUTER_SETTINGS_NAMESPACE = "dsh-tiered-model-router";
var ROUTER_SETTINGS_PATH = "/dsh-tiered-model-router/config";
var ROUTER_MODELS_PATH = "/dsh-tiered-model-router/models";
var ROUTER_MODEL_CHECK_PATH = "/dsh-tiered-model-router/check-model";
var MODEL_SELECTION_PROJECTION_KEY = "dsh-tiered-model-router.modelSelection";
var TIERS = ["easy", "standard", "hard"];
var TIER_LABELS = { easy: "\u7B80\u5355", standard: "\u6807\u51C6", hard: "\u56F0\u96BE" };
var DEFAULT_ROUTE = { provider: "", model: "", reasoningEffort: "", maxTokens: "" };
var DEFAULT_POLICY = {
  defaultTier: "standard",
  routeSubagents: false,
  standardAtStep: 2,
  hardAtStep: 3,
  hardAfterToolFailures: 2,
  standardAtChars: 500,
  hardAtChars: 2500,
  preserveMaxTokens: true,
  clearReasoningEffortWhenUnset: true,
  maxRoutingDepth: 3,
  reasoningFallback: "next-higher",
  reasoningLevelOrder: ["off", "low", "medium", "high", "xhigh", "max", "ultra"],
  easyKeywords: [],
  standardKeywords: [],
  hardKeywords: [],
  hardTools: [],
  failureExclude: []
};
var POLICY_LIST_KEYS = ["easyKeywords", "standardKeywords", "hardKeywords", "hardTools", "failureExclude", "reasoningLevelOrder"];
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
  error: { borderColor: "#f2b8b5", background: "#fff7f6", color: "#9b1c1c" },
  modelSelectRoot: { position: "relative", display: "inline-flex", minWidth: 0 },
  modelTrigger: { display: "inline-flex", alignItems: "center", gap: 4, minWidth: 0, maxWidth: 220, height: 28, border: 0, borderRadius: 24, padding: "0 4px 0 8px", color: "var(--dsw-alias-label-secondary, #667085)", background: "transparent", font: "inherit", fontSize: 13, fontWeight: 500, lineHeight: "20px", cursor: "pointer" },
  modelTriggerLabel: { minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  modelTriggerEffort: { flex: "none", color: "var(--dsw-alias-label-caption, #98a2b3)" },
  actualModel: { minWidth: 0, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--dsw-alias-label-caption, #98a2b3)", fontSize: 12, lineHeight: "18px" },
  modelChevron: { flex: "none", color: "var(--dsw-alias-label-caption, #98a2b3)", fontSize: 12 },
  modelMenu: { position: "absolute", zIndex: 100, right: 0, bottom: "calc(100% + 8px)", width: "min(280px, calc(100vw - 32px))", maxHeight: "min(380px, calc(100vh - 96px))", overflow: "auto", display: "flex", flexDirection: "column", gap: 4, padding: 5, border: "1px solid var(--dsw-alias-border-inverted, #d0d5dd)", borderRadius: 10, background: "var(--dsw-specific-menu, #fff)", color: "var(--dsw-alias-label-primary, #1f2329)", boxShadow: "0 8px 24px rgba(16, 24, 40, .16)" },
  modelMenuButton: { width: "100%", minHeight: 34, border: 0, borderRadius: 7, padding: "7px 9px", textAlign: "left", background: "transparent", color: "inherit", font: "inherit", cursor: "pointer" },
  modelMenuButtonActive: { background: "var(--dsw-alias-interactive-bg-hover, #f2f4f7)" },
  modelMenuSection: { display: "flex", flexDirection: "column", gap: 3 },
  modelMenuTitle: { padding: "5px 9px 2px", color: "var(--dsw-alias-label-tertiary, #98a2b3)", fontSize: 12, lineHeight: "18px" },
  modelMenuSubtext: { display: "block", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--dsw-alias-label-tertiary, #98a2b3)", fontSize: 12, lineHeight: "17px" },
  modelMenuRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }
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
    else if (key === "reasoningFallback") result.policy[key] = ["next-higher", "nearest", "none"].includes(candidate) ? candidate : fallback;
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
function notify(listeners) {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch {
    }
  }
}
var HttpSettingsScope = class {
  constructor(path = ROUTER_SETTINGS_PATH) {
    __publicField(this, "getSnapshot", () => this.snapshot);
    __publicField(this, "subscribe", (listener) => {
      if (typeof listener !== "function") return () => {
      };
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    });
    __publicField(this, "mutate", (ops) => this.write({ action: "mutate", ops }));
    __publicField(this, "replace", (section) => this.write({ action: "replace", section }));
    this.path = path;
    this.listeners = /* @__PURE__ */ new Set();
    this.snapshot = { status: "loading", value: void 0, base: void 0, user: void 0, revision: void 0, writable: false, mode: "route" };
  }
  publish(next) {
    this.snapshot = next;
    notify(this.listeners);
  }
  async load() {
    if (typeof fetch !== "function") {
      this.publish({ ...this.snapshot, status: "unavailable", writable: false });
      return;
    }
    try {
      const response = await fetch(this.path, { headers: { accept: "application/json" } });
      const payload = await response.json();
      if (!response.ok || payload?.ok !== true) throw new Error(String(payload?.error ?? `settings route returned HTTP ${response.status}`));
      this.publish({
        status: "ready",
        value: payload.value,
        base: payload.base,
        user: payload.user,
        revision: payload.revision,
        writable: payload.writable === true,
        mode: "route"
      });
    } catch {
      this.publish({ ...this.snapshot, status: "unavailable", writable: false });
    }
  }
  async write(payload) {
    if (typeof fetch !== "function") throw new Error("\u5F53\u524D DSH \u6CA1\u6709\u53EF\u7528\u7684\u63D2\u4EF6\u8BBE\u7F6E\u901A\u9053");
    const revision = this.snapshot.revision;
    const body = JSON.stringify({ ...payload, ...Number.isSafeInteger(revision) ? { expectedRevision: revision } : {} });
    const response = await fetch(this.path, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body });
    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error(`settings route returned HTTP ${response.status}`);
    }
    if (!response.ok || result?.ok !== true) throw new Error(String(result?.error ?? `settings write failed (HTTP ${response.status})`));
    this.publish({
      status: "ready",
      value: result.value,
      base: result.base,
      user: result.user,
      revision: result.revision,
      writable: result.writable === true,
      mode: "route"
    });
  }
};
var HybridSettingsScope = class {
  constructor(nativeScope) {
    __publicField(this, "getSnapshot", () => this.snapshot);
    __publicField(this, "subscribe", (listener) => {
      if (typeof listener !== "function") return () => {
      };
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    });
    __publicField(this, "mutate", (ops) => this.useNative() && typeof this.nativeScope?.mutate === "function" ? this.nativeScope.mutate(ops) : this.httpScope.mutate(ops));
    __publicField(this, "replace", (section) => this.useNative() && typeof this.nativeScope?.replace === "function" ? this.nativeScope.replace(section) : this.httpScope.replace(section));
    __publicField(this, "set", (field2, value) => this.useNative() && typeof this.nativeScope?.set === "function" ? this.nativeScope.set(field2, value) : this.httpScope.mutate([{ op: "set", path: String(field2).split(".").filter(Boolean), value }]));
    __publicField(this, "unset", (field2) => this.useNative() && typeof this.nativeScope?.unset === "function" ? this.nativeScope.unset(field2) : this.httpScope.mutate([{ op: "unset", path: String(field2).split(".").filter(Boolean) }]));
    this.nativeScope = nativeScope;
    this.httpScope = new HttpSettingsScope();
    this.listeners = /* @__PURE__ */ new Set();
    this.snapshot = nativeScope?.getSnapshot?.() ?? this.httpScope.getSnapshot();
    this.fallbackStarted = false;
    this.nativeDispose = typeof nativeScope?.subscribe === "function" ? nativeScope.subscribe(() => this.syncNative()) : void 0;
    this.syncNative();
  }
  publish(next) {
    this.snapshot = next;
    notify(this.listeners);
  }
  syncNative() {
    const next = this.nativeScope?.getSnapshot?.();
    if (!next) return;
    if (next.status === "unavailable") {
      this.startFallback();
      return;
    }
    this.publish(next);
  }
  startFallback() {
    if (this.fallbackStarted) return;
    this.fallbackStarted = true;
    this.httpScope.subscribe(() => this.publish(this.httpScope.getSnapshot()));
    this.publish(this.httpScope.getSnapshot());
    this.httpScope.load();
  }
  useNative() {
    return this.snapshot?.mode !== "route" && this.snapshot?.status === "ready" && this.snapshot?.writable === true;
  }
};
function useModelPool() {
  const [reloadKey, setReloadKey] = (0, import_react.useState)(0);
  const [snapshot, setSnapshot] = (0, import_react.useState)({ status: "loading", providers: [], error: "" });
  (0, import_react.useEffect)(() => {
    let active = true;
    if (typeof fetch !== "function") {
      setSnapshot({ status: "unavailable", providers: [], error: "\u5F53\u524D\u73AF\u5883\u4E0D\u652F\u6301\u8BFB\u53D6\u6A21\u578B\u6C60" });
      return () => {
        active = false;
      };
    }
    setSnapshot({ status: "loading", providers: [], error: "" });
    fetch(ROUTER_MODELS_PATH, { headers: { accept: "application/json" } }).then(async (response) => {
      let payload;
      try {
        payload = await response.json();
      } catch {
        throw new Error("\u6A21\u578B\u6C60\u8FD4\u56DE\u4E86\u65E0\u6548\u6570\u636E");
      }
      if (!response.ok || payload?.ok !== true || !Array.isArray(payload.providers)) {
        throw new Error(String(payload?.error ?? `\u6A21\u578B\u6C60\u8BFB\u53D6\u5931\u8D25\uFF08HTTP ${response.status}\uFF09`));
      }
      if (active) setSnapshot({ status: "ready", providers: payload.providers, error: "" });
    }).catch((error) => {
      if (active) setSnapshot({ status: "error", providers: [], error: String(error?.message ?? error ?? "\u6A21\u578B\u6C60\u8BFB\u53D6\u5931\u8D25") });
    });
    return () => {
      active = false;
    };
  }, [reloadKey]);
  return { ...snapshot, reload: () => setReloadKey((value) => value + 1) };
}
var MODEL_CHECK_CACHE_TTL_MS = 2 * 60 * 1e3;
var modelCheckCache = /* @__PURE__ */ new Map();
var modelCheckInflight = /* @__PURE__ */ new Map();
function modelCheckKey(provider, model) {
  return `${String(provider ?? "").trim()}\0${String(model ?? "").trim()}`;
}
async function requestModelCheck(provider, model, options = {}) {
  const normalizedProvider = String(provider ?? "").trim();
  const normalizedModel = String(model ?? "").trim();
  if (!normalizedProvider || !normalizedModel) return { status: "unknown", code: "INVALID_REQUEST", message: "\u6A21\u578B\u63D0\u4F9B\u5546\u548C\u6A21\u578B\u4E0D\u80FD\u4E3A\u7A7A" };
  const key = modelCheckKey(normalizedProvider, normalizedModel);
  const now = Date.now();
  const cached = modelCheckCache.get(key);
  if (!options.force && cached && cached.expiresAt > now) return cached.value;
  const inflight = modelCheckInflight.get(key);
  if (inflight) return inflight;
  if (typeof fetch !== "function") return { status: "unknown", code: "CHECK_UNAVAILABLE", message: "\u5F53\u524D\u73AF\u5883\u4E0D\u652F\u6301\u6A21\u578B\u53EF\u7528\u6027\u68C0\u67E5" };
  const pending = (async () => {
    let value;
    try {
      const response = await fetch(ROUTER_MODEL_CHECK_PATH, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ provider: normalizedProvider, model: normalizedModel })
      });
      let payload;
      try {
        payload = await response.json();
      } catch {
        throw new Error(`\u6A21\u578B\u53EF\u7528\u6027\u68C0\u67E5\u8FD4\u56DE\u4E86\u65E0\u6548\u6570\u636E\uFF08HTTP ${response.status}\uFF09`);
      }
      if (!response.ok || payload?.ok !== true) throw new Error(String(payload?.error ?? `\u6A21\u578B\u53EF\u7528\u6027\u68C0\u67E5\u5931\u8D25\uFF08HTTP ${response.status}\uFF09`));
      value = {
        status: ["available", "unavailable", "unknown"].includes(payload.status) ? payload.status : "unknown",
        code: String(payload.code ?? "CHECK_UNKNOWN"),
        reason: String(payload.reason ?? "unknown"),
        message: String(payload.message ?? "\u6A21\u578B\u53EF\u7528\u6027\u6682\u65F6\u65E0\u6CD5\u786E\u8BA4")
      };
    } catch (error) {
      value = { status: "unknown", code: "CHECK_REQUEST_FAILED", reason: "temporary-failure", message: String(error?.message ?? error ?? "\u6A21\u578B\u53EF\u7528\u6027\u6682\u65F6\u65E0\u6CD5\u786E\u8BA4") };
    }
    modelCheckCache.set(key, { value, expiresAt: Date.now() + MODEL_CHECK_CACHE_TTL_MS });
    while (modelCheckCache.size > 64) modelCheckCache.delete(modelCheckCache.keys().next().value);
    return value;
  })();
  modelCheckInflight.set(key, pending);
  try {
    return await pending;
  } finally {
    modelCheckInflight.delete(key);
  }
}
function useModelAvailability(provider, model) {
  const [snapshot, setSnapshot] = (0, import_react.useState)({ status: "idle", code: "", message: "" });
  (0, import_react.useEffect)(() => {
    let active = true;
    if (!String(provider ?? "").trim() || !String(model ?? "").trim()) {
      setSnapshot({ status: "idle", code: "", message: "" });
      return () => {
        active = false;
      };
    }
    setSnapshot({ status: "checking", code: "CHECKING", message: "\u6B63\u5728\u68C0\u67E5\u6A21\u578B\u662F\u5426\u53EF\u7528\u2026" });
    requestModelCheck(provider, model).then((result) => {
      if (active) setSnapshot(result);
    });
    return () => {
      active = false;
    };
  }, [provider, model]);
  return snapshot;
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
function selectField(key, label, value, onChange, options, disabled, emptyLabel) {
  const current = String(value ?? "");
  const known = options.some((option) => option.id === current);
  return import_react.default.createElement(
    "label",
    { style: styles.field, key },
    import_react.default.createElement("span", { style: styles.hint }, label),
    import_react.default.createElement(
      "select",
      {
        style: styles.select,
        value: current,
        onChange: (event) => onChange(event.target.value),
        disabled
      },
      import_react.default.createElement("option", { value: "" }, emptyLabel),
      !known && current ? import_react.default.createElement("option", { value: current, disabled: true }, `\u5F53\u524D\uFF1A${current}\uFF08\u672A\u5728\u6A21\u578B\u6C60\uFF09`) : null,
      options.map((option) => import_react.default.createElement("option", { key: option.id, value: option.id }, option.label))
    )
  );
}
function readSnapshot(store) {
  try {
    return store?.getSnapshot?.() ?? EMPTY_SNAPSHOT;
  } catch {
    return EMPTY_SNAPSHOT;
  }
}
var EMPTY_SNAPSHOT = Object.freeze({});
function useExternalSnapshot(store) {
  const subscribe = typeof store?.subscribe === "function" ? store.subscribe.bind(store) : () => () => {
  };
  const getSnapshot = () => readSnapshot(store);
  return (0, import_react.useSyncExternalStore)(subscribe, getSnapshot, getSnapshot);
}
function modelSelectionLabel(model) {
  return String(model?.name ?? model?.id ?? "").trim() || "\u6A21\u578B";
}
function modelSelectionChoices(state) {
  const groups = Array.isArray(state?.groups) ? state.groups : [];
  return groups.flatMap((group) => {
    const models = Array.isArray(group?.models) ? group.models : [];
    return models.map((model) => ({
      provider: String(group?.id ?? "").trim(),
      model: String(model?.id ?? "").trim(),
      label: modelSelectionLabel(model),
      providerLabel: String(group?.name ?? group?.id ?? "").trim(),
      description: typeof model?.description === "string" ? model.description : "",
      defaultEffort: model?.reasoning?.defaultEffort,
      efforts: Array.isArray(model?.reasoning?.efforts) ? model.reasoning.efforts.map((effort) => ({
        id: String(effort?.id ?? "").trim(),
        name: String(effort?.name ?? effort?.id ?? "").trim(),
        description: typeof effort?.description === "string" ? effort.description : ""
      })).filter((effort) => effort.id) : []
    })).filter((choice) => choice.provider && choice.model);
  });
}
var EMPTY_CHAT_ORDER = Object.freeze([]);
var EMPTY_CHAT_NODES = Object.freeze({ get: () => void 0, values: () => EMPTY_CHAT_ORDER });
var EMPTY_CHAT_SNAPSHOT = Object.freeze({ order: EMPTY_CHAT_ORDER, nodes: EMPTY_CHAT_NODES });
function routeFromSource(source) {
  if (!source || typeof source !== "object") return void 0;
  const provider = String(source.provider ?? "").trim();
  const model = String(source.model ?? "").trim();
  return provider && model ? { provider, model } : void 0;
}
function routesFromChatNode(node) {
  if (!node || typeof node !== "object") return [];
  const routes = node.data?.tokenUsage?.routes;
  if (Array.isArray(routes)) {
    const attributed = routes.map(routeFromSource).filter(Boolean);
    if (attributed.length > 0) return attributed;
  }
  const candidates = [
    node.data?.closing?.finalNode?.source,
    node.data?.finalNode?.source,
    node.data?.source
  ];
  return candidates.map(routeFromSource).filter(Boolean);
}
function latestActualRoute(order, nodes) {
  const keys = Array.isArray(order) ? order : [];
  for (let index = keys.length - 1; index >= 0; index -= 1) {
    let node;
    try {
      node = nodes?.get?.(keys[index]);
    } catch {
      node = void 0;
    }
    const routes = routesFromChatNode(node);
    if (routes.length > 0) return routes[routes.length - 1];
  }
  let values;
  try {
    values = nodes?.values?.();
  } catch {
    values = void 0;
  }
  if (!Array.isArray(values)) return void 0;
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const routes = routesFromChatNode(values[index]);
    if (routes.length > 0) return routes[routes.length - 1];
  }
  return void 0;
}
function sessionProjectionOf(sessions, sessionId, key) {
  try {
    return sessions?.binding?.(sessionId)?.session?.projections?.faceOf?.(key);
  } catch {
    return void 0;
  }
}
function ModelRouterSelect({ locked, available, directory, load, select, sessions, sessionId, routerScope, useChat, useProjection }) {
  const state = useExternalSnapshot(directory);
  const routerState = useExternalSnapshot(routerScope);
  const modelSelectionFace = (0, import_react.useMemo)(
    () => sessionProjectionOf(sessions, sessionId, MODEL_SELECTION_PROJECTION_KEY),
    [sessions, sessionId]
  );
  const legacyModelSelectionFace = (0, import_react.useMemo)(
    () => sessionProjectionOf(sessions, sessionId, "modelSelection"),
    [sessions, sessionId]
  );
  const modelSelectionFromSession = useExternalSnapshot(modelSelectionFace);
  const legacyModelSelectionFromSession = useExternalSnapshot(legacyModelSelectionFace);
  const [open, setOpen] = (0, import_react.useState)(false);
  const [pane, setPane] = (0, import_react.useState)("root");
  const rootRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    if (!available) return void 0;
    try {
      load?.();
    } catch {
    }
    return void 0;
  }, [available, load]);
  const current = state?.current && typeof state.current === "object" ? state.current : void 0;
  const choices = (0, import_react.useMemo)(() => modelSelectionChoices(state), [state]);
  const currentChoice = choices.find((choice) => choice.provider === current?.provider && choice.model === current?.model);
  const modelLabel = currentChoice?.label || String(current?.model ?? "").trim() || "\u9009\u62E9\u6A21\u578B";
  const autoEnabled = routerState?.status === "ready" ? routerState.value?.enabled !== false : false;
  const displayEffort = autoEnabled ? "Auto" : "";
  const chatSelector = typeof useChat === "function" ? useChat : (selector) => selector(EMPTY_CHAT_SNAPSHOT);
  const chatOrder = chatSelector((snapshot) => snapshot?.order ?? EMPTY_CHAT_ORDER);
  const chatNodes = chatSelector((snapshot) => snapshot?.nodes ?? EMPTY_CHAT_NODES);
  const projectionSelector = typeof useProjection === "function" ? useProjection : () => void 0;
  const modelSelection = projectionSelector(MODEL_SELECTION_PROJECTION_KEY) ?? projectionSelector("modelSelection") ?? modelSelectionFromSession ?? legacyModelSelectionFromSession;
  const actualRoute = (0, import_react.useMemo)(
    () => routeFromSource(modelSelection?.lastUsed) ?? latestActualRoute(chatOrder, chatNodes),
    [modelSelection, chatOrder, chatNodes]
  );
  const actualModelLabel = actualRoute ? `${actualRoute.provider} / ${actualRoute.model}` : "";
  (0, import_react.useEffect)(() => {
    if (!open) return void 0;
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, [open]);
  if (!available) return null;
  const refresh = () => {
    try {
      load?.();
    } catch {
    }
  };
  const choose = async (choice) => {
    if (locked || state?.status === "selecting") return;
    if (choice.provider === current?.provider && choice.model === current?.model) {
      setOpen(false);
      await disableAutoAfterManualSelection();
      return;
    }
    let accepted = false;
    try {
      accepted = await Promise.resolve(select?.({ provider: choice.provider, model: choice.model }));
    } catch {
      accepted = false;
    }
    if (!accepted) return;
    setOpen(false);
    await disableAutoAfterManualSelection();
  };
  const chooseEffort = async (effort) => {
    if (locked || state?.status === "selecting" || !current) return;
    const currentEffort = current.reasoningEffort ?? currentChoice?.defaultEffort;
    if (currentEffort === effort) {
      setOpen(false);
      await disableAutoAfterManualSelection();
      return;
    }
    let accepted = false;
    try {
      accepted = await Promise.resolve(select?.({
        provider: current.provider,
        model: current.model,
        ...effort ? { reasoningEffort: effort } : {}
      }));
    } catch {
      accepted = false;
    }
    if (!accepted) return;
    setOpen(false);
    await disableAutoAfterManualSelection();
  };
  async function disableAutoAfterManualSelection() {
    const snapshot = readSnapshot(routerScope);
    if (snapshot?.value?.enabled === false) return;
    let disabled = false;
    try {
      if (typeof routerScope?.set === "function") {
        await routerScope.set("enabled", false);
        disabled = true;
      } else if (typeof routerScope?.mutate === "function") {
        await routerScope.mutate([{ op: "set", path: ["enabled"], value: false }]);
        disabled = true;
      }
    } catch {
    }
    const message = disabled ? "\u5DF2\u624B\u52A8\u5207\u6362\u6A21\u578B\uFF0C\u81EA\u52A8\u8DEF\u7531\u5DF2\u5173\u95ED\u3002" : "\u5DF2\u624B\u52A8\u5207\u6362\u6A21\u578B\uFF0C\u4F46\u81EA\u52A8\u8DEF\u7531\u72B6\u6001\u672A\u80FD\u66F4\u65B0\u3002";
    manualSelectionNotice(sessions, sessionId, message);
  }
  return import_react.default.createElement(
    "div",
    { ref: rootRef, style: styles.modelSelectRoot },
    import_react.default.createElement(
      "button",
      {
        type: "button",
        style: { ...styles.modelTrigger, ...locked ? { opacity: 0.55, cursor: "default" } : {} },
        disabled: locked,
        "aria-haspopup": "menu",
        "aria-expanded": open,
        title: autoEnabled ? `${modelLabel} \xB7 Auto` : modelLabel,
        onClick: () => {
          if (open) {
            setOpen(false);
            setPane("root");
          } else {
            setOpen(true);
            setPane("root");
            refresh();
          }
        }
      },
      import_react.default.createElement("span", { style: styles.modelTriggerLabel }, modelLabel),
      displayEffort ? import_react.default.createElement("span", { style: styles.modelTriggerEffort }, displayEffort) : null,
      import_react.default.createElement("span", { style: styles.modelChevron, "aria-hidden": true }, "\u2304")
    ),
    autoEnabled ? import_react.default.createElement("span", {
      style: styles.actualModel,
      role: "status",
      title: actualModelLabel ? `\u6700\u8FD1\u4E00\u6B21\u5B9E\u9645\u8C03\u7528\uFF1A${actualModelLabel}` : "\u81EA\u52A8\u8DEF\u7531\u5C1A\u672A\u5B8C\u6210\u6A21\u578B\u8C03\u7528"
    }, actualModelLabel ? `\u5B9E\u9645\uFF1A${actualModelLabel}` : "\u5B9E\u9645\uFF1A\u7B49\u5F85\u8BF7\u6C42") : null,
    open ? import_react.default.createElement(
      "div",
      { role: "menu", style: styles.modelMenu, "aria-busy": state?.status === "loading" || state?.status === "selecting" },
      pane === "root" ? import_react.default.createElement(
        import_react.default.Fragment,
        null,
        import_react.default.createElement(
          "button",
          { type: "button", style: styles.modelMenuButton, onClick: () => setPane("model") },
          import_react.default.createElement(
            "span",
            { style: styles.modelMenuRow },
            import_react.default.createElement("span", null, "\u6A21\u578B"),
            import_react.default.createElement("span", { style: styles.hint }, modelLabel)
          )
        ),
        currentChoice?.efforts?.length || currentChoice?.defaultEffort ? import_react.default.createElement(
          "button",
          { type: "button", style: styles.modelMenuButton, onClick: () => setPane("effort") },
          import_react.default.createElement(
            "span",
            { style: styles.modelMenuRow },
            import_react.default.createElement("span", null, "\u63A8\u7406\u7B49\u7EA7"),
            import_react.default.createElement("span", { style: styles.hint }, autoEnabled ? "Auto" : current?.reasoningEffort ?? currentChoice?.defaultEffort ?? "")
          )
        ) : null
      ) : null,
      pane === "model" ? import_react.default.createElement(
        import_react.default.Fragment,
        null,
        state?.status === "loading" ? import_react.default.createElement("div", { style: styles.hint }, "\u6B63\u5728\u5237\u65B0\u6A21\u578B\u5217\u8868\u2026") : null,
        state?.error ? import_react.default.createElement("div", { style: { ...styles.notice, ...styles.error } }, String(state.error)) : null,
        choices.length === 0 && state?.status === "ready" ? import_react.default.createElement("div", { style: styles.hint }, "\u6CA1\u6709\u53EF\u7528\u7684\u6A21\u578B\u3002") : null,
        choices.map((choice) => import_react.default.createElement(
          "button",
          {
            key: `${choice.provider}\0${choice.model}`,
            type: "button",
            role: "menuitemradio",
            "aria-checked": choice.provider === current?.provider && choice.model === current?.model,
            style: choice.provider === current?.provider && choice.model === current?.model ? { ...styles.modelMenuButton, ...styles.modelMenuButtonActive } : styles.modelMenuButton,
            disabled: state?.status === "selecting",
            onClick: () => choose(choice)
          },
          import_react.default.createElement(
            "span",
            { style: styles.modelMenuRow },
            import_react.default.createElement("span", null, choice.label),
            choice.providerLabel ? import_react.default.createElement("span", { style: styles.hint }, choice.providerLabel) : null
          ),
          choice.description ? import_react.default.createElement("span", { style: styles.modelMenuSubtext }, choice.description) : null
        ))
      ) : null,
      pane === "effort" ? import_react.default.createElement(
        import_react.default.Fragment,
        null,
        import_react.default.createElement("div", { style: styles.modelMenuTitle }, "\u63A8\u7406\u7B49\u7EA7"),
        currentChoice?.defaultEffort && !currentChoice.efforts.some((effort) => effort.id === currentChoice.defaultEffort) ? import_react.default.createElement("button", { type: "button", style: styles.modelMenuButton, onClick: () => chooseEffort("") }, "\u9ED8\u8BA4") : null,
        (currentChoice?.efforts ?? []).map((effort) => import_react.default.createElement(
          "button",
          {
            key: effort.id,
            type: "button",
            role: "menuitemradio",
            "aria-checked": (current?.reasoningEffort ?? currentChoice?.defaultEffort) === effort.id,
            style: (current?.reasoningEffort ?? currentChoice?.defaultEffort) === effort.id ? { ...styles.modelMenuButton, ...styles.modelMenuButtonActive } : styles.modelMenuButton,
            disabled: state?.status === "selecting",
            onClick: () => chooseEffort(effort.id)
          },
          import_react.default.createElement(
            "span",
            { style: styles.modelMenuRow },
            import_react.default.createElement("span", null, effort.name || effort.id),
            autoEnabled && effort.id === (current?.reasoningEffort ?? currentChoice?.defaultEffort) ? import_react.default.createElement("span", { style: styles.hint }, "\u5F53\u524D") : null
          ),
          effort.description ? import_react.default.createElement("span", { style: styles.modelMenuSubtext }, effort.description) : null
        ))
      ) : null
    ) : null
  );
}
function manualSelectionNotice(sessions, sessionId, text) {
  try {
    const actx = sessions?.scope?.(sessionId);
    const input = actx?.get?.("conversation")?.input?.for?.(actx);
    input?.notify?.("info", text);
  } catch {
  }
}
function RouteEditor({ tier, route, onChange, disabled, modelPool }) {
  const providers = Array.isArray(modelPool?.providers) ? modelPool.providers : [];
  const providerOptions = providers.filter((provider) => typeof provider?.id === "string" && provider.id.trim()).map((provider) => ({ id: provider.id, label: `${provider.name ?? provider.id}\uFF08${provider.id}\uFF09` }));
  const selectedProvider = providers.find((provider) => provider?.id === route.provider);
  const modelOptions = Array.isArray(selectedProvider?.models) ? selectedProvider.models.filter((model) => typeof model?.id === "string" && model.id.trim()).map((model) => ({ id: model.id, label: `${model.name ?? model.id}\uFF08${model.id}\uFF09` })) : [];
  const selectedModel = selectedProvider?.models?.find((model) => model?.id === route.model);
  const effortOptions = Array.isArray(selectedModel?.reasoningEfforts) ? selectedModel.reasoningEfforts.map((effort) => ({ id: effort, label: effort })) : [];
  const update = (key) => (value) => onChange(key, value);
  const updateProvider = (value) => {
    onChange("provider", value);
    if (value !== route.provider) {
      onChange("model", "");
      onChange("reasoningEffort", "");
    }
  };
  const updateModel = (value) => {
    onChange("model", value);
    if (value !== route.model) onChange("reasoningEffort", "");
  };
  const availability = useModelAvailability(route.provider, route.model);
  const availabilityNotice = availability.status === "available" ? "\u5DF2\u786E\u8BA4\u6A21\u578B\u53EF\u7528" : availability.status === "unavailable" ? `\u6A21\u578B\u4E0D\u53EF\u7528\uFF1A${availability.message}` : availability.status === "checking" ? availability.message : availability.status === "unknown" ? `\u6682\u65F6\u65E0\u6CD5\u786E\u8BA4\u6A21\u578B\u53EF\u7528\u6027\uFF1A${availability.message}` : "";
  return import_react.default.createElement(
    "div",
    { style: styles.group, key: tier },
    import_react.default.createElement("h3", { style: styles.groupTitle }, TIER_LABELS[tier]),
    import_react.default.createElement(
      "div",
      { style: styles.grid },
      selectField(`${tier}-provider`, "\u6A21\u578B\u63D0\u4F9B\u5546", route.provider, updateProvider, providerOptions, disabled, "\u8BF7\u9009\u62E9\u6A21\u578B\u63D0\u4F9B\u5546"),
      selectField(`${tier}-model`, "\u6A21\u578B", route.model, updateModel, modelOptions, disabled || !route.provider, route.provider ? "\u8BF7\u9009\u62E9\u6A21\u578B" : "\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u6A21\u578B\u63D0\u4F9B\u5546"),
      selectField(`${tier}-effort`, "\u63A8\u7406\u7B49\u7EA7", route.reasoningEffort, update("reasoningEffort"), effortOptions, disabled || !route.model, route.model ? "\u8BF7\u9009\u62E9\u63A8\u7406\u7B49\u7EA7" : "\u8BF7\u5148\u9009\u62E9\u6A21\u578B"),
      field(`${tier}-tokens`, "\u6700\u5927\u8F93\u51FA\u4EE4\u724C\uFF08\u53EF\u9009\uFF09", route.maxTokens, update("maxTokens"), "number", { min: 1, step: 1, placeholder: "\u7559\u7A7A\u8868\u793A\u6CBF\u7528", disabled })
    ),
    !route.provider ? import_react.default.createElement("div", { style: styles.hint }, "\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u6A21\u578B\u63D0\u4F9B\u5546") : null,
    availabilityNotice ? import_react.default.createElement("div", {
      style: availability.status === "unavailable" ? { ...styles.notice, ...styles.error } : styles.notice,
      role: availability.status === "unavailable" ? "alert" : void 0
    }, availabilityNotice) : null
  );
}
function PolicyEditor({ policy, onChange, disabled }) {
  const set = (key) => (event) => onChange(key, event.target.type === "checkbox" ? event.target.checked : event.target.value);
  return import_react.default.createElement(
    "div",
    { style: styles.group },
    import_react.default.createElement("h3", { style: styles.groupTitle }, "\u8DEF\u7531\u7B56\u7565"),
    import_react.default.createElement(
      "div",
      { style: styles.grid },
      import_react.default.createElement(
        "label",
        { style: styles.field },
        import_react.default.createElement("span", { style: styles.hint }, "\u9ED8\u8BA4\u6863\u4F4D"),
        import_react.default.createElement(
          "select",
          { style: styles.select, value: policy.defaultTier, onChange: set("defaultTier"), disabled },
          TIERS.map((tier) => import_react.default.createElement("option", { key: tier, value: tier }, TIER_LABELS[tier]))
        )
      ),
      field("standard-step", "\u8FDB\u5165\u6807\u51C6\u6863\u7684\u6B65\u9AA4", policy.standardAtStep, set("standardAtStep"), "number", { min: 1, step: 1, disabled }),
      field("hard-step", "\u8FDB\u5165\u56F0\u96BE\u6863\u7684\u6B65\u9AA4", policy.hardAtStep, set("hardAtStep"), "number", { min: 1, step: 1, disabled }),
      field("tool-failures", "\u5DE5\u5177\u8FDE\u7EED\u5931\u8D25\u591A\u5C11\u6B21\u540E\u8FDB\u5165\u56F0\u96BE\u6863", policy.hardAfterToolFailures, set("hardAfterToolFailures"), "number", { min: 1, step: 1, disabled }),
      field("standard-chars", "\u8FDB\u5165\u6807\u51C6\u6863\u7684\u5B57\u7B26\u6570", policy.standardAtChars, set("standardAtChars"), "number", { min: 1, step: 1, disabled }),
      field("hard-chars", "\u8FBE\u5230\u56F0\u96BE\u6863\u4F4D\u7684\u5B57\u7B26\u6570", policy.hardAtChars, set("hardAtChars"), "number", { min: 1, step: 1, disabled }),
      field("max-routing-depth", "\u6700\u5927\u8DEF\u7531\u9012\u5F52\u6DF1\u5EA6", policy.maxRoutingDepth, set("maxRoutingDepth"), "number", { min: 1, step: 1, disabled })
    ),
    import_react.default.createElement(
      "div",
      { style: { display: "grid", gap: 8 } },
      checkbox("subagents", "\u8DEF\u7531\u5B50\u4EE3\u7406", policy.routeSubagents, set("routeSubagents"), void 0, disabled),
      checkbox("preserve-max", "\u4FDD\u7559\u624B\u52A8\u6700\u5927\u8F93\u51FA\u4EE4\u724C\u6570", policy.preserveMaxTokens, set("preserveMaxTokens"), void 0, disabled),
      checkbox("clear-effort", "\u672A\u914D\u7F6E\u63A8\u7406\u7B49\u7EA7\u65F6\u6E05\u9664\u65E7\u503C", policy.clearReasoningEffortWhenUnset, set("clearReasoningEffortWhenUnset"), void 0, disabled)
    ),
    import_react.default.createElement(
      "div",
      { style: styles.group },
      import_react.default.createElement("h3", { style: styles.groupTitle }, "\u5173\u952E\u8BCD\u4E0E\u5DE5\u5177\u5339\u914D"),
      import_react.default.createElement("p", { style: styles.hint }, "\u6BCF\u884C\u4E00\u4E2A\uFF0C\u4E5F\u53EF\u4EE5\u7528\u9017\u53F7\u5206\u9694\uFF1B\u7559\u7A7A\u8868\u793A\u5173\u95ED\u8BE5\u7C7B\u5339\u914D\u3002"),
      import_react.default.createElement(
        "div",
        { style: styles.grid },
        listField("easy-keywords", "\u7B80\u5355\u6863\u5173\u952E\u8BCD", policy.easyKeywords, set("easyKeywords"), "\u4F8B\u5982\uFF1Ahello\n\u7FFB\u8BD1", disabled),
        listField("standard-keywords", "\u6807\u51C6\u6863\u5173\u952E\u8BCD", policy.standardKeywords, set("standardKeywords"), "\u4F8B\u5982\uFF1Acode\n\u6587\u4EF6", disabled),
        listField("hard-keywords", "\u56F0\u96BE\u6863\u5173\u952E\u8BCD", policy.hardKeywords, set("hardKeywords"), "\u4F8B\u5982\uFF1Aproduction\n\u8FC1\u79FB", disabled),
        listField("hard-tools", "\u56F0\u96BE\u5DE5\u5177\u540D\u79F0", policy.hardTools, set("hardTools"), "\u4F8B\u5982\uFF1Aapply_patch\nshell", disabled),
        listField("failure-exclude", "\u5FFD\u7565\u7684\u5DE5\u5177\u5931\u8D25", policy.failureExclude, set("failureExclude"), "\u4F8B\u5982\uFF1Atodo_write", disabled)
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
  const modelPool = useModelPool();
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
      setError(`${TIER_LABELS[invalidTier]} \u5FC5\u987B\u9009\u62E9\u6A21\u578B\u63D0\u4F9B\u5546\u548C\u6A21\u578B`);
      return;
    }
    if (modelPool.status !== "ready") {
      setError("\u6A21\u578B\u6C60\u5C1A\u672A\u52A0\u8F7D\u5B8C\u6210\uFF0C\u6682\u65F6\u4E0D\u80FD\u4FDD\u5B58");
      return;
    }
    const unlistedTier = TIERS.find((tier) => {
      const provider = modelPool.providers.find((row) => row?.id === draft.tiers[tier]?.provider);
      return !provider?.models?.some((row) => row?.id === draft.tiers[tier]?.model);
    });
    if (unlistedTier) {
      setError(`${TIER_LABELS[unlistedTier]} \u4E2D\u7684\u6A21\u578B\u4E0D\u5728\u5F53\u524D\u6A21\u578B\u6C60\u5185\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const checks = await Promise.all(TIERS.map((tier) => {
        const route = draft.tiers[tier];
        return requestModelCheck(route.provider, route.model, { force: true });
      }));
      const unavailableIndex = checks.findIndex((result) => result?.status === "unavailable");
      if (unavailableIndex >= 0) {
        const tier = TIERS[unavailableIndex];
        setError(`${TIER_LABELS[tier]} \u7684\u6A21\u578B\u4E0D\u53EF\u7528\uFF1A${checks[unavailableIndex].message}`);
        return;
      }
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
      import_react.default.createElement("p", { style: styles.description }, "\u6839\u636E\u4EFB\u52A1\u96BE\u5EA6\u5728\u7B80\u5355\u3001\u6807\u51C6\u3001\u56F0\u96BE\u4E09\u6863\u4E4B\u95F4\u81EA\u52A8\u5207\u6362\u6A21\u578B\u3002\u6A21\u578B\u540D\u79F0\u548C\u6A21\u578B\u63D0\u4F9B\u5546\u5B8C\u5168\u7531\u4F60\u914D\u7F6E\u3002")
    ),
    statusNotice ? import_react.default.createElement("div", { style: styles.notice }, statusNotice) : null,
    error ? import_react.default.createElement("div", { style: { ...styles.notice, ...styles.error }, role: "alert" }, error) : null,
    modelPool.status === "error" ? import_react.default.createElement("div", { style: { ...styles.notice, ...styles.error }, role: "alert" }, modelPool.error || "\u6A21\u578B\u6C60\u8BFB\u53D6\u5931\u8D25") : null,
    import_react.default.createElement(
      "div",
      { style: styles.toolbar },
      checkbox("enabled", "\u542F\u7528\u81EA\u52A8\u6A21\u578B\u8DEF\u7531", draft.enabled, (event) => changed(["enabled"], event.target.checked), "\u5173\u95ED\u540E\u4FDD\u7559\u8BBE\u7F6E\uFF0C\u4F46\u8BF7\u6C42\u76F4\u63A5\u6CBF\u7528 DSH \u5F53\u524D\u6A21\u578B\u3002", !editable),
      dirty ? import_react.default.createElement("span", { style: styles.hint }, "\u6709\u672A\u4FDD\u5B58\u7684\u4FEE\u6539") : null
    ),
    import_react.default.createElement(
      "div",
      { style: styles.toolbar },
      import_react.default.createElement("span", { style: styles.hint }, modelPool.status === "loading" ? "\u6B63\u5728\u8BFB\u53D6\u6A21\u578B\u6C60\u2026" : `\u53EF\u9009\u6A21\u578B\u63D0\u4F9B\u5546\uFF1A${modelPool.providers.length} \u4E2A`),
      import_react.default.createElement("button", { type: "button", style: styles.button, onClick: modelPool.reload, disabled: modelPool.status === "loading" }, "\u5237\u65B0\u6A21\u578B\u6C60")
    ),
    TIERS.map((tier) => import_react.default.createElement(RouteEditor, {
      key: tier,
      tier,
      route: draft.tiers[tier],
      disabled: !editable,
      modelPool,
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
var inject = ["slots", "settingsScope", "sessions", "modelDirectories"];
function apply(ctx) {
  let scope;
  try {
    const nativeScope = ctx.settingsScope.bind({ namespace: ROUTER_SETTINGS_NAMESPACE });
    scope = new HybridSettingsScope(nativeScope);
  } catch (error) {
    try {
      ctx.logger?.warn?.(`dsh-tiered-model-router native settings UI unavailable: ${String(error?.message ?? error)}`);
    } catch {
    }
    scope = new HttpSettingsScope();
    scope.load();
  }
  try {
    const sessions = ctx.sessions;
    const modelDirectories = ctx.modelDirectories;
    if (ctx.slots && typeof ctx.slots.inject === "function" && modelDirectories && sessions) {
      ctx.slots.inject("conversation.input.model", () => ctx.slots.register({
        name: "conversation.input.model",
        priority: -100,
        inject: (sessionId) => {
          let directory;
          try {
            directory = modelDirectories.directoryFor(sessionId);
          } catch {
            return { available: false };
          }
          const available = typeof sessions.subagentAddress !== "function" || sessions.subagentAddress(sessionId) === void 0;
          return {
            available,
            directory: directory?.store,
            load: () => {
              if (available) directory?.load?.().catch?.(() => {
              });
            },
            select: (selection) => available && typeof directory?.select === "function" ? directory.select(selection).then(() => true, () => false) : Promise.resolve(false),
            sessions,
            sessionId,
            routerScope: scope
          };
        }
      }, ModelRouterSelect));
    }
  } catch (error) {
    try {
      ctx.logger?.warn?.(`dsh-tiered-model-router model selector unavailable: ${String(error?.message ?? error)}`);
    } catch {
    }
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
