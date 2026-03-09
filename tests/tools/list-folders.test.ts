import { describe, it, expect, beforeEach } from "vitest";
import { createMockApp } from "../mock-obsidian";
import { MockMcpServer } from "../mock-mcp-server";
import { registerListFolders } from "../../src/tools/list-folders";

describe("list_folders", () => {
	let server: MockMcpServer;

	beforeEach(() => {
		server = new MockMcpServer();
		const app = createMockApp({
			files: {
				"notes/a.md": "",
				"notes/sub/b.md": "",
				"notes/sub/deep/c.md": "",
				"other/d.md": "",
			},
		});
		registerListFolders(server as any, app);
	});

	it("lists folders from root with depth limit", async () => {
		const result = await server.callTool("list_folders", {});
		const text = result.content[0].text;
		expect(text).toContain("notes");
		expect(text).toContain("other");
		expect(text).toContain("notes/sub");
		expect(text).toContain("notes/sub/deep");
	});

	it("lists from specific parent path", async () => {
		const result = await server.callTool("list_folders", { path: "notes" });
		const text = result.content[0].text;
		expect(text).toContain("notes/sub");
		expect(text).not.toContain("other");
	});

	it("respects depth parameter", async () => {
		const result = await server.callTool("list_folders", { depth: 1 });
		const text = result.content[0].text;
		expect(text).toContain("notes");
		expect(text).toContain("other");
		expect(text).not.toContain("notes/sub");
	});

	it("returns error when path is not a folder", async () => {
		const result = await server.callTool("list_folders", { path: "notes/a.md" });
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain("Folder not found");
	});

	it("returns 'No folders found.' for empty vault", async () => {
		const app = createMockApp({ files: {} });
		const s = new MockMcpServer();
		registerListFolders(s as any, app);
		const result = await s.callTool("list_folders", {});
		expect(result.content[0].text).toBe("No folders found.");
	});

	it("sorts alphabetically", async () => {
		const result = await server.callTool("list_folders", {});
		const folders = result.content[0].text.split("\n");
		const sorted = [...folders].sort();
		expect(folders).toEqual(sorted);
	});
});
