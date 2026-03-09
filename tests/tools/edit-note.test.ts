import { describe, it, expect, beforeEach } from "vitest";
import { createMockApp } from "../mock-obsidian";
import { MockMcpServer } from "../mock-mcp-server";
import { registerEditNote } from "../../src/tools/edit-note";

describe("edit_note", () => {
	let server: MockMcpServer;
	let app: any;

	beforeEach(() => {
		server = new MockMcpServer();
		app = createMockApp({
			files: { "note.md": "line1\nline2\nline3" },
		});
		registerEditNote(server as any, app);
	});

	it("append: adds content after existing with newline", async () => {
		const result = await server.callTool("edit_note", {
			path: "note.md",
			operation: "append",
			content: "line4",
		});
		expect(result.content[0].text).toContain("append");
		const content = await app.vault.read(app.vault.getAbstractFileByPath("note.md"));
		expect(content).toBe("line1\nline2\nline3\nline4");
	});

	it("prepend: adds content before existing with newline", async () => {
		const result = await server.callTool("edit_note", {
			path: "note.md",
			operation: "prepend",
			content: "line0",
		});
		expect(result.content[0].text).toContain("prepend");
		const content = await app.vault.read(app.vault.getAbstractFileByPath("note.md"));
		expect(content).toBe("line0\nline1\nline2\nline3");
	});

	it("replace: substitutes first occurrence of find with content", async () => {
		const result = await server.callTool("edit_note", {
			path: "note.md",
			operation: "replace",
			content: "replaced",
			find: "line2",
		});
		expect(result.content[0].text).toContain("replace");
		const content = await app.vault.read(app.vault.getAbstractFileByPath("note.md"));
		expect(content).toBe("line1\nreplaced\nline3");
	});

	it("replace error: missing find parameter", async () => {
		const result = await server.callTool("edit_note", {
			path: "note.md",
			operation: "replace",
			content: "something",
		});
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain("find");
	});

	it("replace error: find text not in note", async () => {
		const result = await server.callTool("edit_note", {
			path: "note.md",
			operation: "replace",
			content: "something",
			find: "nonexistent",
		});
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain("not found");
	});

	it("returns error for non-existent note path", async () => {
		const result = await server.callTool("edit_note", {
			path: "missing.md",
			operation: "append",
			content: "text",
		});
		expect(result.isError).toBe(true);
	});
});
