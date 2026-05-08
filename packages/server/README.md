# vibe-annotations-server

Global MCP server for Vibe Annotations Firefox extension.

## Quick start

```bash
npx vibe-annotations-server init
```

Interactive wizard installs package globally, starts server on port 3846, configures MCP for your AI coding agent, and links Firefox extension setup. Flags: `--agent <name>` (repeatable), `--non-interactive`, `--project`, `--skip-server`, `--skip-extension`, `--reset`.

## Manual installation

```bash
npm install -g vibe-annotations-server
vibe-annotations-server start
```

## Usage

```bash
vibe-annotations-server start
vibe-annotations-server stop
vibe-annotations-server status
vibe-annotations-server restart
vibe-annotations-server logs
vibe-annotations-server logs -f
```

## MCP Integration

After server starts, add this MCP server entry in your AI agent/client config:

```json
{
  "mcpServers": {
    "vibe-annotations": {
      "url": "http://127.0.0.1:3846/mcp"
    }
  }
}
```

Alternative TOML:

```toml
[mcp_servers.vibe-annotations]
url = "http://127.0.0.1:3846/mcp"
```

If your client only supports SSE, use `http://127.0.0.1:3846/sse`.

## Architecture

The server provides:
- **MCP Endpoint** (`/mcp`)
- **SSE Endpoint** (`/sse`, legacy)
- **HTTP API** (`/api/annotations`) for Firefox extension sync
- **Health Check** (`/health`)

Data stored in `~/.vibe-annotations/annotations.json`.

## Development

```bash
git clone <repo-url>
cd vibe-annotations-server
npm install
npm run dev
```

## License

MIT
