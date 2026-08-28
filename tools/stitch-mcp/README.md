# DD Box Stitch MCP

Repo-local stdio proxy for the Google Stitch MCP endpoint. The API key is read at process startup from Secret Manager and is never stored in source, Codex config, shell arguments, or repository files.

Codex registration:

```bash
codex mcp add stitch -- /absolute/path/to/tools/stitch-mcp/start.sh
```

The configured server becomes callable only in a new Codex session. The current implementation session may use `inspect-project.mjs`, which talks to the same Stitch MCP endpoint through `@google/stitch-sdk`.

Source: https://stitch.withgoogle.com/docs/mcp/setup
