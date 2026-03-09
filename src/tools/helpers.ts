import { App, TFile } from "obsidian";

export type McpTextResult = { content: [{ type: "text"; text: string }]; isError?: true };

export function resolveNote(app: App, path: string): TFile | McpTextResult {
	const file = app.vault.getAbstractFileByPath(path);
	if (file instanceof TFile) return file;
	return { content: [{ type: "text", text: `Note not found: ${path}` }], isError: true };
}

export function filterByFolder(app: App, path?: string): TFile[] {
	const files = app.vault.getMarkdownFiles();
	if (!path) return files;
	const prefix = path.endsWith("/") ? path : path + "/";
	return files.filter((f) => f.path.startsWith(prefix));
}
