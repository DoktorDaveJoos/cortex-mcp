import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { App } from "obsidian";
import { filterByFolder } from "./helpers";

export function registerListNotes(server: McpServer, app: App) {
	server.tool(
		"list_notes",
		"List notes in the vault, optionally filtered by folder",
		{
			path: z.string().optional().describe("Folder path to list (e.g. 'projects'). Omit for vault root."),
			recursive: z.boolean().optional().default(true).describe("Include notes in subfolders (default: true)"),
		},
		async ({ path, recursive }) => {
			let files = filterByFolder(app, path);

			if (path && !recursive) {
				const prefix = path.endsWith("/") ? path : path + "/";
				files = files.filter((f) => !f.path.slice(prefix.length).contains("/"));
			}

			files.sort((a, b) => a.path.localeCompare(b.path));

			const lines = files.map((f) => {
				const size = f.stat.size;
				const mtime = new Date(f.stat.mtime).toISOString().slice(0, 16).replace("T", " ");
				return `${f.path}  (${size}B, ${mtime})`;
			});

			return {
				content: [{ type: "text", text: lines.length > 0 ? lines.join("\n") : "No notes found." }],
			};
		}
	);
}
