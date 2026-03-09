import { describe, it, expect, beforeEach } from "vitest";
import { createMockApp } from "../mock-obsidian";
import { MockMcpServer } from "../mock-mcp-server";
import { registerSearchNotes } from "../../src/tools/search-notes";

describe("search_notes", () => {
	let server: MockMcpServer;

	beforeEach(() => {
		server = new MockMcpServer();
		const app = createMockApp({
			files: {
				"notes/hello.md": "Hello World",
				"notes/bye.md": "Goodbye World",
				"other/readme.md": "Read this file carefully",
			},
		});
		registerSearchNotes(server as any, app);
	});

	it("finds matching notes with case-insensitive search", async () => {
		const result = await server.callTool("search_notes", { query: "world" });
		expect(result.content[0].text).toContain("Found 2 result(s)");
	});

	it("returns snippet with context around match", async () => {
		const result = await server.callTool("search_notes", { query: "Goodbye" });
		expect(result.content[0].text).toContain("Goodbye World");
	});

	it("respects folder filter (path parameter)", async () => {
		const result = await server.callTool("search_notes", { query: "world", path: "notes" });
		expect(result.content[0].text).toContain("Found 2 result(s)");
		expect(result.content[0].text).not.toContain("other/");
	});

	it("returns 'No results found.' for no matches", async () => {
		const result = await server.callTool("search_notes", { query: "zzzzz" });
		expect(result.content[0].text).toBe("No results found.");
	});

	it("snippet includes ellipsis when truncated", async () => {
		// Build a file with content long enough to trigger truncation
		const longContent = "A".repeat(100) + "TARGET" + "B".repeat(100);
		const app = createMockApp({
			files: { "long.md": longContent },
		});
		const s = new MockMcpServer();
		registerSearchNotes(s as any, app);

		const result = await s.callTool("search_notes", { query: "TARGET" });
		expect(result.content[0].text).toContain("...");
	});

	it("caps at 50 results", async () => {
		const files: Record<string, string> = {};
		for (let i = 0; i < 60; i++) {
			files[`file${i}.md`] = "match-me";
		}
		const app = createMockApp({ files });
		const s = new MockMcpServer();
		registerSearchNotes(s as any, app);

		const result = await s.callTool("search_notes", { query: "match-me" });
		expect(result.content[0].text).toContain("Found 50 result(s)");
	});
});
