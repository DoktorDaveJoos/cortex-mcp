import { createServer, IncomingMessage, ServerResponse, Server } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { App, Notice } from "obsidian";
import { registerAllTools } from "./tools";

const MAX_BODY_BYTES = 1024 * 1024; // 1 MB
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface SessionEntry {
	transport: StreamableHTTPServerTransport;
	lastActivity: number;
}

export class CortexServer {
	private httpServer: Server | null = null;
	private sessions = new Map<string, SessionEntry>();
	private sweepInterval: ReturnType<typeof setInterval> | null = null;
	private app: App;
	private port: number;

	constructor(app: App, port: number) {
		this.app = app;
		this.port = port;
	}

	async start(): Promise<void> {
		if (this.httpServer) return;

		this.httpServer = createServer((req, res) => {
			this.handleRequest(req, res).catch((err) => {
				console.error("Cortex: unhandled request error", err);
				if (!res.headersSent) {
					res.writeHead(500, { "Content-Type": "application/json" });
					res.end(JSON.stringify({ error: "Internal server error" }));
				}
			});
		});

		return new Promise((resolve, reject) => {
			const onError = (err: NodeJS.ErrnoException) => {
				if (err.code === "EADDRINUSE") {
					new Notice(`Cortex: port ${this.port} is already in use`);
				}
				this.httpServer = null;
				reject(err);
			};

			this.httpServer!.once("error", onError);

			this.httpServer!.listen(this.port, "127.0.0.1", () => {
				this.httpServer!.removeListener("error", onError);
				this.httpServer!.on("error", (err) => {
					console.error("Cortex: server error", err);
				});

				this.sweepInterval = setInterval(() => this.sweepSessions(), SESSION_TTL_MS / 2);

				console.debug(`Cortex MCP server listening on 127.0.0.1:${this.port}`);
				resolve();
			});
		});
	}

	async stop(): Promise<void> {
		if (this.sweepInterval) {
			clearInterval(this.sweepInterval);
			this.sweepInterval = null;
		}

		for (const { transport } of this.sessions.values()) {
			await transport.close();
		}
		this.sessions.clear();

		return new Promise((resolve) => {
			if (!this.httpServer) {
				resolve();
				return;
			}
			this.httpServer.close(() => {
				this.httpServer = null;
				console.debug("Cortex MCP server stopped");
				resolve();
			});
		});
	}

	get isRunning(): boolean {
		return this.httpServer !== null;
	}

	private sweepSessions() {
		const now = Date.now();
		for (const [id, entry] of this.sessions) {
			if (now - entry.lastActivity > SESSION_TTL_MS) {
				void entry.transport.close();
				this.sessions.delete(id);
			}
		}
	}

	private async handleRequest(req: IncomingMessage, res: ServerResponse) {
		const url = new URL(req.url || "/", `http://127.0.0.1:${this.port}`);

		if (url.pathname !== "/mcp") {
			res.writeHead(404, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ error: "Not found" }));
			return;
		}

		if (req.method === "POST") {
			await this.handlePost(req, res);
		} else if (req.method === "GET" || req.method === "DELETE") {
			await this.handleSessionRequest(req, res);
		} else {
			res.writeHead(405, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ error: "Method not allowed" }));
		}
	}

	private async handlePost(req: IncomingMessage, res: ServerResponse) {
		const body = await this.readBody(req);
		if (body === null) {
			res.writeHead(413, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ error: "Request body too large" }));
			return;
		}

		let parsed: unknown;
		try {
			parsed = JSON.parse(body);
		} catch {
			res.writeHead(400, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ error: "Invalid JSON" }));
			return;
		}

		const sessionId = req.headers["mcp-session-id"] as string | undefined;

		if (sessionId && this.sessions.has(sessionId)) {
			const entry = this.sessions.get(sessionId)!;
			entry.lastActivity = Date.now();
			await entry.transport.handleRequest(req, res, parsed);
			return;
		}

		if (this.isInitializeRequest(parsed)) {
			let capturedSessionId: string | undefined;

			const transport = new StreamableHTTPServerTransport({
				sessionIdGenerator: () => crypto.randomUUID(),
				onsessioninitialized: (newSessionId) => {
					capturedSessionId = newSessionId;
					this.sessions.set(newSessionId, { transport, lastActivity: Date.now() });
				},
			});

			transport.onclose = () => {
				if (capturedSessionId) this.sessions.delete(capturedSessionId);
			};

			const mcpServer = this.createMcpServer();
			await mcpServer.connect(transport);
			await transport.handleRequest(req, res, parsed);
		} else if (sessionId) {
			res.writeHead(404, { "Content-Type": "application/json" });
			res.end(
				JSON.stringify({
					jsonrpc: "2.0",
					error: { code: -32000, message: "Invalid or expired session" },
					id: null,
				})
			);
		} else {
			res.writeHead(400, { "Content-Type": "application/json" });
			res.end(
				JSON.stringify({
					jsonrpc: "2.0",
					error: { code: -32600, message: "Missing session ID. Send an initialize request first." },
					id: null,
				})
			);
		}
	}

	private async handleSessionRequest(req: IncomingMessage, res: ServerResponse) {
		const sessionId = req.headers["mcp-session-id"] as string | undefined;
		if (!sessionId || !this.sessions.has(sessionId)) {
			res.writeHead(404, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ error: "Invalid or missing session ID" }));
			return;
		}
		const entry = this.sessions.get(sessionId)!;
		entry.lastActivity = Date.now();
		await entry.transport.handleRequest(req, res);
	}

	private createMcpServer(): McpServer {
		const server = new McpServer({
			name: "cortex",
			version: "1.0.0",
		});
		registerAllTools(server, this.app);
		return server;
	}

	private isInitializeRequest(body: unknown): boolean {
		if (typeof body === "object" && body !== null && "method" in body) {
			return (body as { method: string }).method === "initialize";
		}
		if (Array.isArray(body)) {
			return body.some(
				(msg) =>
					typeof msg === "object" &&
					msg !== null &&
					"method" in msg &&
					msg.method === "initialize"
			);
		}
		return false;
	}

	private readBody(req: IncomingMessage): Promise<string | null> {
		return new Promise((resolve, reject) => {
			let size = 0;
			const chunks: Buffer[] = [];
			req.on("data", (chunk: Buffer) => {
				size += chunk.length;
				if (size > MAX_BODY_BYTES) {
					req.destroy();
					resolve(null);
				} else {
					chunks.push(chunk);
				}
			});
			req.on("end", () => resolve(Buffer.concat(chunks).toString()));
			req.on("error", reject);
		});
	}
}
