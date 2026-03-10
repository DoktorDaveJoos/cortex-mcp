import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { App, getAllTags } from "obsidian";
import { filterByFolder } from "./helpers";

export function registerListTags(server: McpServer, app: App) {
	server.registerTool("list_tags", {
		description: "List all tags in the vault with their frequency",
		inputSchema: {
			path: z.string().optional().describe("Limit to notes under this folder path"),
		},
	}, ({ path }) => {
		const tagCounts = new Map<string, number>();
		const files = filterByFolder(app, path);

		for (const file of files) {
			const cache = app.metadataCache.getFileCache(file);
			if (!cache) continue;
			const tags = getAllTags(cache);
			if (!tags) continue;
			for (const tag of tags) {
				tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
			}
		}

		if (tagCounts.size === 0) {
			return { content: [{ type: "text", text: "No tags found." }] };
		}

		const sorted = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);
		const lines = sorted.map(([tag, count]) => `${tag}: ${count}`);
		return { content: [{ type: "text", text: lines.join("\n") }] };
	});
}
