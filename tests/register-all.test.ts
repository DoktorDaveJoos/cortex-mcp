import { describe, it, expect } from "vitest";
import { createMockApp } from "./mock-obsidian";
import { MockMcpServer } from "./mock-mcp-server";
import { registerAllTools } from "../src/tools";

describe("registerAllTools", () => {
	it("registers all 9 tools", () => {
		const server = new MockMcpServer();
		const app = createMockApp({ files: {} });
		registerAllTools(server as any, app);

		const expected = [
			"read_note",
			"write_note",
			"edit_note",
			"search_notes",
			"list_notes",
			"get_note_metadata",
			"delete_note",
			"list_tags",
			"list_folders",
		];

		expect(server.tools.size).toBe(9);
		for (const name of expected) {
			expect(server.tools.has(name), `missing tool: ${name}`).toBe(true);
		}
	});
});
