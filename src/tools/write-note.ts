import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { App, TFile, TFolder } from "obsidian";

async function ensureFolder(app: App, folderPath: string) {
	if (!folderPath || folderPath === "/") return;
	const existing = app.vault.getAbstractFileByPath(folderPath);
	if (existing instanceof TFolder) return;
	await app.vault.createFolder(folderPath);
}

export function registerWriteNote(server: McpServer, app: App) {
	server.registerTool("write_note", {
		description: "Create or overwrite a note at the given path",
		inputSchema: {
			path: z.string().describe("Path to the note (e.g. 'folder/note.md')"),
			content: z.string().describe("Full content to write"),
		},
	}, async ({ path, content }) => {
		const file = app.vault.getAbstractFileByPath(path);
		if (file instanceof TFile) {
			await app.vault.modify(file, content);
			return { content: [{ type: "text", text: `Updated: ${path}` }] };
		}
		const folder = path.contains("/") ? path.slice(0, path.lastIndexOf("/")) : "";
		if (folder) await ensureFolder(app, folder);
		await app.vault.create(path, content);
		return { content: [{ type: "text", text: `Created: ${path}` }] };
	});
}
