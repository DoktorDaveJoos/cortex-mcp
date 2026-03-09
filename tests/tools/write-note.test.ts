import { describe, it, expect, beforeEach } from "vitest";
import { createMockApp } from "../mock-obsidian";
import { MockMcpServer } from "../mock-mcp-server";
import { registerWriteNote } from "../../src/tools/write-note";

describe("write_note", () => {
	let server: MockMcpServer;
	let app: any;

	beforeEach(() => {
		server = new MockMcpServer();
		app = createMockApp({
			files: { "existing.md": "old content" },
		});
		registerWriteNote(server as any, app);
	});

	it("overwrites existing note via vault.modify", async () => {
		const result = await server.callTool("write_note", {
			path: "existing.md",
			content: "new content",
		});
		expect(result.content[0].text).toContain("Updated");
		const content = await app.vault.read(app.vault.getAbstractFileByPath("existing.md"));
		expect(content).toBe("new content");
	});

	it("creates new note when file doesn't exist and folder exists", async () => {
		// Root folder always exists
		const result = await server.callTool("write_note", {
			path: "new.md",
			content: "brand new",
		});
		expect(result.content[0].text).toContain("Created");
		const file = app.vault.getAbstractFileByPath("new.md");
		expect(file).not.toBeNull();
	});

	it("creates note with nested folder (ensureFolder)", async () => {
		const result = await server.callTool("write_note", {
			path: "deep/nested/note.md",
			content: "deep content",
		});
		expect(result.content[0].text).toContain("Created");
		const file = app.vault.getAbstractFileByPath("deep/nested/note.md");
		expect(file).not.toBeNull();
	});

	it("creates note at root (no folder in path)", async () => {
		const result = await server.callTool("write_note", {
			path: "root-note.md",
			content: "root content",
		});
		expect(result.content[0].text).toContain("Created");
	});
});
