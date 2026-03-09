import { describe, it, expect, beforeEach } from "vitest";
import { createMockApp } from "../mock-obsidian";
import { MockMcpServer } from "../mock-mcp-server";
import { registerListNotes } from "../../src/tools/list-notes";

describe("list_notes", () => {
	let server: MockMcpServer;

	beforeEach(() => {
		server = new MockMcpServer();
		const app = createMockApp({
			files: {
				"notes/a.md": "aaa",
				"notes/sub/b.md": "bbb",
				"other/c.md": "ccc",
			},
		});
		registerListNotes(server as any, app);
	});

	it("lists all notes sorted by path", async () => {
		const result = await server.callTool("list_notes", {});
		const text = result.content[0].text;
		const lines = text.split("\n");
		expect(lines).toHaveLength(3);
		// Should be sorted alphabetically
		expect(lines[0]).toContain("notes/a.md");
		expect(lines[1]).toContain("notes/sub/b.md");
		expect(lines[2]).toContain("other/c.md");
	});

	it("filters by folder", async () => {
		const result = await server.callTool("list_notes", { path: "notes" });
		const text = result.content[0].text;
		expect(text).toContain("notes/a.md");
		expect(text).toContain("notes/sub/b.md");
		expect(text).not.toContain("other/c.md");
	});

	it("non-recursive mode excludes subfolder notes", async () => {
		const result = await server.callTool("list_notes", { path: "notes", recursive: false });
		const text = result.content[0].text;
		expect(text).toContain("notes/a.md");
		expect(text).not.toContain("notes/sub/b.md");
	});

	it("shows size and mtime in output format", async () => {
		const result = await server.callTool("list_notes", {});
		const text = result.content[0].text;
		// Format: path  (sizeB, YYYY-MM-DD HH:MM)
		expect(text).toMatch(/\d+B/);
		expect(text).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
	});

	it("returns 'No notes found.' when empty", async () => {
		const app = createMockApp({ files: {} });
		const s = new MockMcpServer();
		registerListNotes(s as any, app);
		const result = await s.callTool("list_notes", {});
		expect(result.content[0].text).toBe("No notes found.");
	});
});
