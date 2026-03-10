import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { App, TFolder } from "obsidian";

export function registerListFolders(server: McpServer, app: App) {
	server.registerTool("list_folders", {
		description: "List folders in the vault",
		inputSchema: {
			path: z.string().optional().describe("Parent folder path (omit for vault root)"),
			depth: z.number().optional().default(3).describe("Max depth to recurse (default: 3)"),
		},
	}, ({ path, depth }) => {
		const root = path
			? app.vault.getAbstractFileByPath(path)
			: app.vault.getRoot();

		if (!(root instanceof TFolder)) {
			return { content: [{ type: "text", text: `Folder not found: ${path}` }], isError: true };
		}

		const folders: string[] = [];

		function walk(folder: TFolder, currentDepth: number) {
			for (const child of folder.children) {
				if (child instanceof TFolder) {
					folders.push(child.path);
					if (currentDepth < depth) {
						walk(child, currentDepth + 1);
					}
				}
			}
		}

		walk(root, 1);
		folders.sort();

		return {
			content: [{ type: "text", text: folders.length > 0 ? folders.join("\n") : "No folders found." }],
		};
	});
}
