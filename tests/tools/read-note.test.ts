import { describe, it, expect, beforeEach } from "vitest";
import { createMockApp } from "../mock-obsidian";
import { MockMcpServer } from "../mock-mcp-server";
import { registerReadNote } from "../../src/tools/read-note";

describe("read_note", () => {
	let server: MockMcpServer;

	beforeEach(() => {
		server = new MockMcpServer();
		const app = createMockApp({
			files: { "notes/hello.md": "# Hello\nWorld" },
		});
		registerReadNote(server as any, app);
	});

	it("reads existing note content", async () => {
		const result = await server.callTool("read_note", { path: "notes/hello.md" });
		expect(result.content[0].text).toBe("# Hello\nWorld");
		expect(result.isError).toBeUndefined();
	});

	it("returns error for non-existent path", async () => {
		const result = await server.callTool("read_note", { path: "nope.md" });
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain("nope.md");
	});
});
