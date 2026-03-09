import { describe, it, expect, beforeEach } from "vitest";
import { createMockApp } from "../mock-obsidian";
import { MockMcpServer } from "../mock-mcp-server";
import { registerGetNoteMetadata } from "../../src/tools/get-note-metadata";

describe("get_note_metadata", () => {
	let server: MockMcpServer;

	beforeEach(() => {
		server = new MockMcpServer();
		const app = createMockApp({
			files: {
				"rich.md": "---\ntitle: Rich\n---\n# Heading\n#tag1 #tag2",
				"plain.md": "Just text",
				"no-cache.md": "No metadata",
			},
			metadata: {
				"rich.md": {
					frontmatter: { title: "Rich" },
					tags: [{ tag: "#tag1" }, { tag: "#tag2" }],
					headings: [{ level: 1, heading: "Heading" }],
					links: [{ link: "other-note" }],
				},
				"plain.md": {},
			},
		});
		registerGetNoteMetadata(server as any, app);
	});

	it("returns frontmatter, tags, links, headings as JSON", async () => {
		const result = await server.callTool("get_note_metadata", { path: "rich.md" });
		const parsed = JSON.parse(result.content[0].text);
		expect(parsed.frontmatter).toEqual({ title: "Rich" });
		expect(parsed.tags).toEqual(["#tag1", "#tag2"]);
		expect(parsed.links).toEqual(["other-note"]);
		expect(parsed.headings).toEqual([{ level: 1, heading: "Heading" }]);
	});

	it("omits missing fields (no tags → no tags key)", async () => {
		const result = await server.callTool("get_note_metadata", { path: "plain.md" });
		const parsed = JSON.parse(result.content[0].text);
		expect(parsed.tags).toBeUndefined();
		expect(parsed.frontmatter).toBeUndefined();
	});

	it("returns error for missing note", async () => {
		const result = await server.callTool("get_note_metadata", { path: "nope.md" });
		expect(result.isError).toBe(true);
	});

	it("returns error when no cached metadata", async () => {
		const result = await server.callTool("get_note_metadata", { path: "no-cache.md" });
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain("No cached metadata");
	});
});
