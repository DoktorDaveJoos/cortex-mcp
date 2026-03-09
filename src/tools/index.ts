import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { App } from "obsidian";

import { registerReadNote } from "./read-note";
import { registerWriteNote } from "./write-note";
import { registerEditNote } from "./edit-note";
import { registerSearchNotes } from "./search-notes";
import { registerListNotes } from "./list-notes";
import { registerGetNoteMetadata } from "./get-note-metadata";
import { registerDeleteNote } from "./delete-note";
import { registerListTags } from "./list-tags";
import { registerListFolders } from "./list-folders";

export function registerAllTools(server: McpServer, app: App) {
	registerReadNote(server, app);
	registerWriteNote(server, app);
	registerEditNote(server, app);
	registerSearchNotes(server, app);
	registerListNotes(server, app);
	registerGetNoteMetadata(server, app);
	registerDeleteNote(server, app);
	registerListTags(server, app);
	registerListFolders(server, app);
}
