import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { App, TFile } from "obsidian";
import { resolveNote } from "./helpers";

export function registerReadNote(server: McpServer, app: App) {
	server.tool(
		"read_note",
		"Read the content of a note by its vault path",
		{ path: z.string().describe("Path to the note (e.g. 'folder/note.md')") },
		async ({ path }) => {
			const file = resolveNote(app, path);
			if (!(file instanceof TFile)) return file;
			const content = await app.vault.read(file);
			return { content: [{ type: "text", text: content }] };
		}
	);
}
