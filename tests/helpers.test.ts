import { describe, it, expect } from "vitest";
import { TFile } from "obsidian";
import { createMockApp } from "./mock-obsidian";
import { resolveNote, filterByFolder } from "../src/tools/helpers";

describe("resolveNote", () => {
	const app = createMockApp({
		files: {
			"notes/hello.md": "# Hello",
			"root.md": "Root note",
		},
	});

	it("returns TFile when file exists", () => {
		const result = resolveNote(app, "notes/hello.md");
		expect(result).toBeInstanceOf(TFile);
		expect((result as TFile).path).toBe("notes/hello.md");
	});

	it("returns error when path does not exist", () => {
		const result = resolveNote(app, "nope.md");
		expect(result).not.toBeInstanceOf(TFile);
		expect((result as any).isError).toBe(true);
		expect((result as any).content[0].text).toContain("nope.md");
	});

	it("returns error when path points to a folder", () => {
		const result = resolveNote(app, "notes");
		expect(result).not.toBeInstanceOf(TFile);
		expect((result as any).isError).toBe(true);
	});
});

describe("filterByFolder", () => {
	const app = createMockApp({
		files: {
			"notes/a.md": "",
			"notes/sub/b.md": "",
			"other/c.md": "",
			"root.md": "",
		},
	});

	it("returns all markdown files when no path given", () => {
		const files = filterByFolder(app);
		expect(files).toHaveLength(4);
	});

	it("filters to folder prefix when path given", () => {
		const files = filterByFolder(app, "notes");
		expect(files.every((f) => f.path.startsWith("notes/"))).toBe(true);
		expect(files).toHaveLength(2);
	});

	it("handles path with trailing slash", () => {
		const files = filterByFolder(app, "notes/");
		expect(files).toHaveLength(2);
	});

	it("returns empty array when folder has no markdown files", () => {
		const files = filterByFolder(app, "empty");
		expect(files).toHaveLength(0);
	});
});
