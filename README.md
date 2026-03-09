<p align="center">
  <img src="logo.svg" alt="Cortex logo" width="128" height="128"/>
</p>

<h1 align="center">Cortex</h1>

<p align="center">
  Your Obsidian vault, available to your AI coding tools — read, write, search, and organize notes from Claude Code, Codex, or OpenCode.
</p>

---

## What it does

Cortex lets AI coding tools work directly with your Obsidian notes. It runs a local [MCP](https://modelcontextprotocol.io) server inside Obsidian that any compatible client can connect to over HTTP — no cloud services, no syncing, no config files to wrestle with.

## Quick start

1. Install from **Obsidian Community Plugins** (search "Cortex")
2. Enable the plugin — the server auto-starts on port `27182`
3. Connect your client:

### Claude Code

```sh
claude mcp add --transport http cortex http://127.0.0.1:27182/mcp
```

### Codex

Add to `.codex/config.toml` in your project (or `~/.codex/config.toml` for global):

```toml
[mcp_servers.cortex]
type = "remote"
url = "http://127.0.0.1:27182/mcp"
```

### OpenCode

Add to your `opencode.json`:

```json
{
  "mcp": {
    "cortex": {
      "type": "remote",
      "url": "http://127.0.0.1:27182/mcp"
    }
  }
}
```

4. **Verify**: ask your AI tool to run `list_folders` — if it returns your vault's folder structure, you're connected.

## Example usage

Once connected, just ask your AI tool in natural language:

- "Summarize my meeting notes from this week"
- "Create a note in Projects/my-app with today's architecture decisions"
- "Search my vault for everything about authentication"
- "List all tags I've used and how often"

## Available tools

| Tool | Description |
|------|-------------|
| `read_note` | Read the content of a note by its vault path |
| `write_note` | Create or overwrite a note at the given path |
| `edit_note` | Append, prepend, or find-and-replace in a note |
| `search_notes` | Full-text search across notes in the vault |
| `list_notes` | List notes, optionally filtered by folder |
| `get_note_metadata` | Get frontmatter, tags, links, and headings |
| `delete_note` | Delete a note (moves to trash by default) |
| `list_tags` | List all tags in the vault with their frequency |
| `list_folders` | List folders in the vault |

## Connecting a project

You can tell your AI tool which Obsidian folder maps to the current project. This way, when it creates or looks for notes, it knows where to put them.

Add a snippet to your project root:

**`CLAUDE.md`** (Claude Code) or **`AGENTS.md`** (Codex, OpenCode):

```markdown
## Cortex
- Cortex folder for this project: `Projects/my-app`
```

Replace `Projects/my-app` with your vault folder path. OpenCode checks `AGENTS.md` first, then falls back to `CLAUDE.md`.

## Configuration

Open **Settings → Cortex** to configure:

- **Port** — HTTP port for the MCP server (default `27182`, requires restart)
- **Auto-start** — Start the server when Obsidian launches (default on)

## Troubleshooting

- **Server not starting** — Check if port `27182` is already in use. Change the port in settings if needed.
- **Client can't connect** — Make sure Obsidian is open and the server is running (check the status bar icon).
- **Changed the port** — Update the URL in your client config to match the new port.

## Support

If Cortex is useful to you, consider supporting its development.

<a href="https://buymeacoffee.com/davidjoos">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="48">
</a>

## Security

- Binds to `127.0.0.1` only — no remote access by default
- Traffic stays on your machine

## Build from source

```sh
npm install
npm run build
```

Copy `main.js` and `manifest.json` into your vault at `.obsidian/plugins/cortex/`.

