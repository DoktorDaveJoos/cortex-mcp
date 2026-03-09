import { describe, it, expect, beforeEach } from "vitest";
import { createMockApp } from "../mock-obsidian";
import { MockMcpServer } from "../mock-mcp-server";
import { registerListTags } from "../../src/tools/list-tags";

describe("list_tags", () => {
	let server: MockMcpServer;

	beforeEach(() => {
		server = new MockMcpServer();
		const app = createMockApp({
			files: {
				"notes/a.md": "#tag1 #tag2",
				"notes/b.md": "#tag1 #tag3",
				"other/c.md": "#tag2",
			},
			metadata: {
				"notes/a.md": { tags: [{ tag: "#tag1" }, { tag: "#tag2" }] },
				"notes/b.md": { tags: [{ tag: "#tag1" }, { tag: "#tag3" }] },
				"other/c.md": { tags: [{ tag: "#tag2" }] },
			},
		});
		registerListTags(server as any, app);
	});

	it("aggregates tags across multiple files with frequency counts", async () => {
		const result = await server.callTool("list_tags", {});
		const text = result.content[0].text;
		expect(text).toContain("#tag1: 2");
		expect(text).toContain("#tag2: 2");
		expect(text).toContain("#tag3: 1");
	});

	it("sorts by descending count", async () => {
		const result = await server.callTool("list_tags", {});
		const lines = result.content[0].text.split("\n");
		// #tag1 and #tag2 have count 2, #tag3 has count 1
		const counts = lines.map((l: string) => parseInt(l.split(": ")[1]));
		for (let i = 1; i < counts.length; i++) {
			expect(counts[i]).toBeLessThanOrEqual(counts[i - 1]);
		}
	});

	it("respects folder filter", async () => {
		const result = await server.callTool("list_tags", { path: "notes" });
		const text = result.content[0].text;
		expect(text).toContain("#tag1: 2");
		expect(text).toContain("#tag3: 1");
		// #tag2 only appears once in "notes" scope (notes/a.md)
		expect(text).toContain("#tag2: 1");
	});

	it("returns 'No tags found.' when none", async () => {
		const app = createMockApp({
			files: { "empty.md": "no tags" },
			metadata: {},
		});
		const s = new MockMcpServer();
		registerListTags(s as any, app);
		const result = await s.callTool("list_tags", {});
		expect(result.content[0].text).toBe("No tags found.");
	});
});
