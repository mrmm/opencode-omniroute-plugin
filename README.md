# @mr.mm/opencode-omniroute-plugin

[![CI](https://github.com/mrmm/opencode-omniroute-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/mrmm/opencode-omniroute-plugin/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@mr.mm/opencode-omniroute-plugin)](https://www.npmjs.com/package/@mr.mm/opencode-omniroute-plugin)

OpenCode plugin for the [OmniRoute AI Gateway](https://github.com/diegosouzapw/OmniRoute).

Pulls a live model catalog from `/v1/models`, aggregates combos via `/api/combos`, maps OmniRoute capabilities to the OpenCode `ModelV2` contract, and supports multiple side-by-side OmniRoute instances.

Fork of [`@omniroute/opencode-plugin`](https://github.com/diegosouzapw/OmniRoute/tree/main/%40omniroute/opencode-plugin) with additional fixes — see [Changes from upstream](#changes-from-upstream).

## Install

```sh
npm install @mr.mm/opencode-omniroute-plugin
# or
bunx add @mr.mm/opencode-omniroute-plugin
```

For local development, clone and build:

```sh
git clone https://github.com/mrmm/opencode-omniroute-plugin
cd opencode-omniroute-plugin
bun install && bun run build
```

Then reference the dist directly in `opencode.jsonc`:

```jsonc
{
  "plugin": [
    [
      "/path/to/opencode-omniroute-plugin/dist/index.js",
      { "providerId": "omniroute" },
    ],
  ],
}
```

## Quick start

```jsonc
// ~/.config/opencode/opencode.jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    [
      "@mr.mm/opencode-omniroute-plugin",
      {
        "providerId": "omniroute",
        "baseURL": "https://your-omniroute-instance.example.com",
        "modelCacheTtl": 300000,
      },
    ],
  ],
}
```

```sh
opencode auth login --provider omniroute
# prompts for API key, writes to ~/.local/share/opencode/auth.json
```

> **Note:** Use `--provider` explicitly. `opencode auth login omniroute` is parsed as a positional URL argument on OC ≤1.15.5 and fails. Tracked upstream.

## Multi-instance (prod + staging)

OC ≤1.15.5 dedupes plugin loads by module path — two entries pointing at the same file collapse to one. Workaround: install the package twice into separate directories.

```sh
mkdir -p ~/.config/opencode/plugins/omniroute-prod
mkdir -p ~/.config/opencode/plugins/omniroute-staging
npm install --prefix ~/.config/opencode/plugins/omniroute-prod    @mr.mm/opencode-omniroute-plugin
npm install --prefix ~/.config/opencode/plugins/omniroute-staging @mr.mm/opencode-omniroute-plugin
```

```jsonc
{
  "plugin": [
    [
      "./plugins/omniroute-prod/node_modules/@mr.mm/opencode-omniroute-plugin/dist/index.js",
      { "providerId": "omniroute", "baseURL": "https://or.example.com" },
    ],
    [
      "./plugins/omniroute-staging/node_modules/@mr.mm/opencode-omniroute-plugin/dist/index.js",
      {
        "providerId": "omniroute-staging",
        "baseURL": "https://or-staging.example.com",
      },
    ],
  ],
}
```

## Plugin options

| Option          | Type     | Default                            | Description                                                     |
| --------------- | -------- | ---------------------------------- | --------------------------------------------------------------- |
| `providerId`    | `string` | `"omniroute"`                      | Unique provider id across plugin entries                        |
| `displayName`   | `string` | `"OmniRoute"` / `OmniRoute (<id>)` | Label in the OpenCode UI                                        |
| `modelCacheTtl` | `number` | `300000` (5 min)                   | `/v1/models` TTL in ms — keep ≥60 000 to avoid compaction hangs |
| `baseURL`       | `string` | from `auth.json` after `/connect`  | Override OmniRoute base URL                                     |
| `features`      | `object` | see below                          | Feature toggles                                                 |

### `features` block

| Feature               | Default | Description                                                                                |
| --------------------- | ------- | ------------------------------------------------------------------------------------------ |
| `combos`              | `true`  | Surface `/api/combos` as pseudo-models with LCD capability/limit join                      |
| `enrichment`          | `true`  | Overlay display names + per-token pricing from `/api/pricing/models`                       |
| `compressionMetadata` | `false` | Tag combo names with compression pipeline emoji (e.g. `[rtk🟡 → caveman🟠]`)               |
| `providerTag`         | `true`  | Prepend upstream provider label so `cc/claude-opus-4-7 → Claude - Claude Opus 4.7`         |
| `usableOnly`          | `false` | Filter to providers with a healthy connection in `/api/providers`                          |
| `diskCache`           | `true`  | Persist last-good catalog to disk; hydrates on cold start when `/v1/models` is unreachable |
| `geminiSanitization`  | `true`  | Strip `$schema`/`$ref`/`additionalProperties` from tool params for `gemini-*` models       |
| `mcpAutoEmit`         | `false` | Auto-write `mcp.<providerId>` pointing at `<baseURL>/api/mcp/stream`                       |
| `fetchInterceptor`    | `true`  | Inject `Authorization: Bearer` on requests targeting `baseURL`                             |

## Changes from upstream

Fixes applied on top of [`@omniroute/opencode-plugin`](https://github.com/diegosouzapw/OmniRoute/tree/main/%40omniroute/opencode-plugin) at v3.8.9:

| Fix                              | Detail                                                                                                                                                                                                                                                                            |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `interleaved` capability mapping | `caps.thinking` from OmniRoute was not propagated to `ModelV2.capabilities.interleaved` (hardcoded `false`). Extended thinking models now surface correctly in OpenCode's picker. Upstream PR: [diegosouzapw/OmniRoute#3138](https://github.com/diegosouzapw/OmniRoute/pull/3138) |

## Development

```sh
bun install
bun run build   # tsup → dist/
bun test tests/ # 228 tests, ~150ms
```

### Release

Tag a version to trigger the release workflow (builds, tests, publishes to npm, creates GitHub Release):

```sh
git tag v0.1.2 && git push origin v0.1.2
```

## Requirements

- Node `>=22` or Bun `>=1.1`
- OpenCode `>=1.15` with `@opencode-ai/plugin >=1.14.49`

## License

MIT — see [LICENSE](./LICENSE).
