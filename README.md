<p align="center">
  <img src="logo.svg" alt="Cortex logo" width="128" height="128"/>
</p>

<h1 align="center">Cortex</h1>

<p align="center">
  Give your AI coding tools access to your Obsidian vault.
</p>

---

## What it does

Cortex runs a local [MCP](https://modelcontextprotocol.io) server inside Obsidian, exposing 9 tools for reading, writing, searching, and organizing notes. Any MCP-compatible client — Claude Code, Codex, OpenCode — can connect over HTTP and work with your vault.

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

## Configuration

Open **Settings → Cortex** to configure:

- **Port** — HTTP port for the MCP server (default `27182`, requires restart)
- **Auto-start** — Start the server when Obsidian launches (default on)

## Project snippets

To tell your AI tool which Obsidian folder to use for a project, add a snippet to the project root:

**`CLAUDE.md`** (Claude Code):

```markdown
## Cortex
- Cortex folder for this project: `<your-folder>`
```

**`AGENTS.md`** (Codex, OpenCode):

```markdown
## Cortex
- Cortex folder for this project: `<your-folder>`
```

Replace `<your-folder>` with the vault folder path (e.g. `Projects/my-app`). OpenCode checks `AGENTS.md` first, then falls back to `CLAUDE.md`.

## Security

- Binds to `127.0.0.1` only — no remote access by default
- Traffic stays on your machine

## Build from source

```sh
npm install
npm run build
```

Copy `main.js` and `manifest.json` into your vault at `.obsidian/plugins/cortex/`.

## Support

<a href="https://buymeacoffee.com/davidjoos"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=davidjoos&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" /></a>
