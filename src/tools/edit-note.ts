import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { App, TFile } from "obsidian";
import { resolveNote } from "./helpers";

export function registerEditNote(server: McpServer, app: App) {
	server.registerTool("edit_note", {
		description: "Edit a note: append, prepend, or find-and-replace (first occurrence)",
		inputSchema: {
			path: z.string().describe("Path to the note"),
			operation: z.enum(["append", "prepend", "replace"]).describe("Type of edit"),
			content: z.string().describe("Content to insert or replacement text"),
			find: z.string().optional().describe("Text to find (required for replace operation)"),
		},
	}, async ({ path, operation, content, find }) => {
		const file = resolveNote(app, path);
		if (!(file instanceof TFile)) return file;

		const existing = await app.vault.read(file);
		let updated: string;

		switch (operation) {
			case "append":
				updated = existing + "\n" + content;
				break;
			case "prepend":
				updated = content + "\n" + existing;
				break;
			case "replace":
				if (!find) {
					return { content: [{ type: "text", text: "'find' parameter is required for replace operation" }], isError: true };
				}
				if (!existing.includes(find)) {
					return { content: [{ type: "text", text: `Text not found in note: "${find}"` }], isError: true };
				}
				updated = existing.replace(find, content);
				break;
		}

		await app.vault.modify(file, updated);
		return { content: [{ type: "text", text: `Edited: ${path} (${operation})` }] };
	});
}
