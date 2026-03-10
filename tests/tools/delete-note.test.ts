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

	it("calls fileManager.trashFile", async () => {
		const trashSpy = vi.spyOn(app.fileManager, "trashFile");
		const result = await server.callTool("delete_note", { path: "to-trash.md" });
		expect(trashSpy).toHaveBeenCalled();
		expect(result.content[0].text).toContain("Deleted");
		expect(app.vault.getAbstractFileByPath("to-trash.md")).toBeNull();
	});

	it("removes file from vault", async () => {
		await server.callTool("delete_note", { path: "to-delete.md" });
		expect(app.vault.getAbstractFileByPath("to-delete.md")).toBeNull();
	});

	it("returns error for non-existent note", async () => {
		const result = await server.callTool("delete_note", { path: "nope.md" });
		expect(result.isError).toBe(true);
	});

	it("response includes path", async () => {
		const result = await server.callTool("delete_note", { path: "to-trash.md" });
		expect(result.content[0].text).toContain("to-trash.md");
	});
});
