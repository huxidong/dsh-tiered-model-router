# dsh-tiered-model-router

A native DeepSeek Harness plugin that locally classifies each turn as `easy`, `standard`, or `hard`, then changes the DSH request route. It does not add a model gateway or make an extra LLM judge call.

## Design

- Pure deterministic classifier with configurable keywords and length thresholds.
- Cache-aware session stability: a route stays on its current tier unless the
  new task or an actual failure/hard-tool signal requires an upgrade.
- One-way escalation within a turn: `easy -> standard -> hard`.
- Tool failures and configured hard tools can escalate to `hard`.
- When automatic routing is enabled, the configured three-tier routes own the
  request even if the host opened the session with another model. Choosing a
  model from the model seat switches automatic routing off for that session.
- Request rewriting preserves unknown/future `LlmCallConfig` fields.
- Invalid configuration, listener failures, and cleanup failures fail open.
- DSH-specific event wiring is isolated in `src/dsh-adapter.js`.

## Install

## Package install

The repository includes a browser module-loader bundle, so users do not need to rebuild the client UI. Create an installable tarball and add it to a DSH profile:

```powershell
npm run package
dsh plugin --profile web add .\dist\dsh-tiered-model-router-0.1.3.tgz
```

Restart the profile after installing or upgrading the bundle. Then open the Web Settings page named `模型路由` to edit all three routes, thresholds, toggles, keyword lists, and hard-tool/failure policies. Changes are persisted through DSH Settings and apply to later requests without editing YAML.

For a source checkout, `dsh plugin --profile web add .` is also supported. After publishing to npm, use `dsh plugin --profile web add dsh-tiered-model-router`.

`cordis.patch.yml` remains the composition-level base and an advanced fallback. Values saved from the GUI override that base; `恢复组合配置` clears the user override.

The three routes are freely configurable. The plugin does not know or require `dsh-fast`/`dsh-strong`; those are just possible model ids.

## Policy defaults

The default tier is `standard`. Clearly simple prompts can use `easy`; code, file, command, tool, and API work is at least `standard`; security, production, migration, architecture, destructive operations, long prompts, and similar signals use `hard`.

The legacy `preserveExplicitSelection` and `takeOverUnknownSelection` fields
remain accepted for configuration compatibility, but automatic mode is now
unambiguous: the router takes ownership while enabled. Subagents are routed by
default, and the cache-aware policy keeps a session from automatically
downgrading to a different model. Step-count escalation is opt-in because it
would otherwise switch models in a normal tool loop and reduce provider prompt
cache hits.

Run `npm test` to execute both pure logic tests and the local real-DSH integration checks. The integration test uses a mock adapter and does not require model credentials or network model calls.

For another local DSH checkout, set `DSH_UPSTREAM_DIR` before running the tests.
