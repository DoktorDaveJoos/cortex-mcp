import { describe, it, expect, beforeEach } from "vitest";
import { vi } from "vitest";
import { createMockApp } from "../mock-obsidian";
import { MockMcpServer } from "../mock-mcp-server";
import { registerDeleteNote } from "../../src/tools/delete-note";

describe("delete_note", () => {
	let server: MockMcpServer;
	let app: any;

	beforeEach(() => {
		server = new MockMcpServer();
		app = createMockApp({
			files: {
				"to-trash.md": "trash me",
				"to-delete.md": "delete me",
			},
		});
		registerDeleteNote(server as any, app);
	});

	it("soft delete (default): calls vault.trash", async () => {
		const trashSpy = vi.spyOn(app.vault, "trash");
		const result = await server.callTool("delete_note", { path: "to-trash.md" });
		expect(trashSpy).toHaveBeenCalled();
		expect(result.content[0].text).toContain("trashed");
		expect(app.vault.getAbstractFileByPath("to-trash.md")).toBeNull();
	});

	it("permanent delete: calls vault.delete", async () => {
		const deleteSpy = vi.spyOn(app.vault, "delete");
		const result = await server.callTool("delete_note", { path: "to-delete.md", permanent: true });
		expect(deleteSpy).toHaveBeenCalled();
		expect(result.content[0].text).toContain("permanent");
		expect(app.vault.getAbstractFileByPath("to-delete.md")).toBeNull();
	});

	it("returns error for non-existent note", async () => {
		const result = await server.callTool("delete_note", { path: "nope.md" });
		expect(result.isError).toBe(true);
	});

	it("response text differs for trash vs permanent", async () => {
		const r1 = await server.callTool("delete_note", { path: "to-trash.md" });
		expect(r1.content[0].text).toContain("trashed");
		expect(r1.content[0].text).not.toContain("permanent");
	});
});
