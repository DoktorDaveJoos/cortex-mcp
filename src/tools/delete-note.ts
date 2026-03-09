import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { App, TFile } from "obsidian";
import { resolveNote } from "./helpers";

export function registerDeleteNote(server: McpServer, app: App) {
	server.tool(
		"delete_note",
		"Delete a note (moves to trash by default)",
		{
			path: z.string().describe("Path to the note to delete"),
			permanent: z.boolean().optional().default(false).describe("Permanently delete instead of trashing (default: false)"),
		},
		async ({ path, permanent }) => {
			const file = resolveNote(app, path);
			if (!(file instanceof TFile)) return file;

			if (permanent) {
				await app.vault.delete(file);
			} else {
				await app.vault.trash(file, false);
			}

			return { content: [{ type: "text", text: `Deleted: ${path}${permanent ? " (permanent)" : " (trashed)"}` }] };
		}
	);
}
