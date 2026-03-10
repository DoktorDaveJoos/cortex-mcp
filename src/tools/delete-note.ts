import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { App, TFile } from "obsidian";
import { resolveNote } from "./helpers";

export function registerDeleteNote(server: McpServer, app: App) {
	server.registerTool("delete_note", {
		description: "Delete a note (moves to trash by default)",
		inputSchema: {
			path: z.string().describe("Path to the note to delete"),
		},
	}, async ({ path }) => {
		const file = resolveNote(app, path);
		if (!(file instanceof TFile)) return file;

		await app.fileManager.trashFile(file);

		return { content: [{ type: "text", text: `Deleted: ${path}` }] };
	});
}
