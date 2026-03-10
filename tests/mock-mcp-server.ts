// Lightweight mock that captures tool handlers registered via server.registerTool()
// Applies Zod schema defaults so handlers see the same values as the real McpServer.

import { z } from "zod";

export class MockMcpServer {
	tools = new Map<string, { description: string; schema: any; handler: Function }>();

	registerTool(name: string, config: { description: string; inputSchema?: any }, handler: Function) {
		this.tools.set(name, { description: config.description, schema: config.inputSchema, handler });
	}

	async callTool(name: string, args: Record<string, unknown>) {
		const entry = this.tools.get(name);
		if (!entry) throw new Error(`Tool not registered: ${name}`);
		// Parse through Zod to apply defaults (e.g. .default(true))
		const parsed = entry.schema ? z.object(entry.schema).parse(args) : args;
		return entry.handler(parsed);
	}
}
