import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { App, TFile, getAllTags } from "obsidian";
import { resolveNote } from "./helpers";

export function registerGetNoteMetadata(server: McpServer, app: App) {
	server.tool(
		"get_note_metadata",
		"Get frontmatter, tags, links, and headings for a note",
		{
			path: z.string().describe("Path to the note"),
		},
		async ({ path }) => {
			const file = resolveNote(app, path);
			if (!(file instanceof TFile)) return file;

			const cache = app.metadataCache.getFileCache(file);
			if (!cache) {
				return { content: [{ type: "text", text: `No cached metadata for: ${path}` }], isError: true };
			}

			const result: Record<string, unknown> = {};

			if (cache.frontmatter) {
				result.frontmatter = cache.frontmatter;
			}

			const tags = getAllTags(cache);
			if (tags && tags.length > 0) {
				result.tags = tags;
			}

			if (cache.links) {
				result.links = cache.links.map((l) => l.link);
			}

			if (cache.headings) {
				result.headings = cache.headings.map((h) => ({
					level: h.level,
					heading: h.heading,
				}));
			}

			return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
		}
	);
}
