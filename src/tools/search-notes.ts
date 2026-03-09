import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { App } from "obsidian";
import { filterByFolder } from "./helpers";

export function registerSearchNotes(server: McpServer, app: App) {
	server.tool(
		"search_notes",
		"Full-text search across notes in the vault",
		{
			query: z.string().describe("Text to search for (case-insensitive)"),
			path: z.string().optional().describe("Limit search to notes under this folder path"),
		},
		async ({ query, path }) => {
			const files = filterByFolder(app, path);
			const queryLower = query.toLowerCase();
			const results: { path: string; snippet: string }[] = [];

			for (const file of files) {
				if (results.length >= 50) break;
				const content = await app.vault.cachedRead(file);
				const idx = content.toLowerCase().indexOf(queryLower);
				if (idx === -1) continue;

				const start = Math.max(0, idx - 60);
				const end = Math.min(content.length, idx + query.length + 60);
				const snippet = (start > 0 ? "..." : "") + content.slice(start, end) + (end < content.length ? "..." : "");
				results.push({ path: file.path, snippet });
			}

			if (results.length === 0) {
				return { content: [{ type: "text", text: "No results found." }] };
			}

			const text = results.map((r) => `**${r.path}**\n${r.snippet}`).join("\n\n");
			return { content: [{ type: "text", text: `Found ${results.length} result(s):\n\n${text}` }] };
		}
	);
}
