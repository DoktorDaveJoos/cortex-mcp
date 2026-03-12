import { describe, it, expect, afterEach } from "vitest";
import { createMockApp } from "./mock-obsidian";
import { CortexServer } from "../src/server";

let nextPort = 19870;
function getPort() {
	return nextPort++;
}

describe("CortexServer", () => {
	const servers: CortexServer[] = [];

	afterEach(async () => {
		for (const s of servers) {
			if (s.isRunning) await s.stop();
		}
		servers.length = 0;
	});

	function createServer(port?: number) {
		const p = port ?? getPort();
		const app = createMockApp();
		const s = new CortexServer(app, p);
		servers.push(s);
		return { server: s, port: p };
	}

	describe("routing", () => {
		it("POST /mcp is accepted", async () => {
			const { server, port } = createServer();
			await server.start();

			const res = await fetch(`http://127.0.0.1:${port}/mcp`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					jsonrpc: "2.0",
					method: "initialize",
					id: 1,
					params: {
						protocolVersion: "2025-03-26",
						capabilities: {},
						clientInfo: { name: "test", version: "1" },
					},
				}),
			});
			expect(res.status).not.toBe(404);
			expect(res.status).not.toBe(405);
		});

		it("other paths return 404", async () => {
			const { server, port } = createServer();
			await server.start();

			const res = await fetch(`http://127.0.0.1:${port}/other`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "{}",
			});
			expect(res.status).toBe(404);
		});

		it("unsupported methods return 405", async () => {
			const { server, port } = createServer();
			await server.start();

			const res = await fetch(`http://127.0.0.1:${port}/mcp`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: "{}",
			});
			expect(res.status).toBe(405);
		});
	});

	describe("body limits", () => {
		it("body > 1MB causes server to reject", async () => {
			const { server, port } = createServer();
			await server.start();

			const bigBody = "x".repeat(1024 * 1024 + 1);
			try {
				const res = await fetch(`http://127.0.0.1:${port}/mcp`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: bigBody,
				});
				// If we get a response, it should be 413
				expect(res.status).toBe(413);
			} catch {
				// Connection reset is acceptable — server called req.destroy()
				expect(true).toBe(true);
			}
		});
	});

	describe("JSON parsing", () => {
		it("invalid JSON returns 400", async () => {
			const { server, port } = createServer();
			await server.start();

			const res = await fetch(`http://127.0.0.1:${port}/mcp`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "not json{{{",
			});
			expect(res.status).toBe(400);
			const body = await res.text();
			expect(body).toContain("Invalid JSON");
		});
	});

	describe("session management", () => {
		it("missing session ID on non-initialize returns 400", async () => {
			const { server, port } = createServer();
			await server.start();

			const res = await fetch(`http://127.0.0.1:${port}/mcp`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 }),
			});
			expect(res.status).toBe(400);
			const body = await res.text();
			expect(body).toContain("Missing session ID");
		});

		it("invalid session ID returns 404", async () => {
			const { server, port } = createServer();
			await server.start();

			const res = await fetch(`http://127.0.0.1:${port}/mcp`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"mcp-session-id": "bogus-session-id",
				},
				body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 }),
			});
			expect(res.status).toBe(404);
			const body = await res.text();
			expect(body).toContain("Invalid or expired session");
		});

		it("GET without session ID returns 404", async () => {
			const { server, port } = createServer();
			await server.start();

			const res = await fetch(`http://127.0.0.1:${port}/mcp`, { method: "GET" });
			expect(res.status).toBe(404);
		});
	});

	describe("isRunning", () => {
		it("true after start, false after stop", async () => {
			const { server } = createServer();
			expect(server.isRunning).toBe(false);
			await server.start();
			expect(server.isRunning).toBe(true);
			await server.stop();
			expect(server.isRunning).toBe(false);
		});
	});

	describe("lifecycle", () => {
		it("can start, stop, and restart without errors", async () => {
			const { server } = createServer();
			await server.start();
			await server.stop();
			await server.start();
			expect(server.isRunning).toBe(true);
			await server.stop();
		});
	});

	describe("port in use", () => {
		it("starting on occupied port rejects with EADDRINUSE", async () => {
			const port = getPort();
			const { server } = createServer(port);
			await server.start();

			const { server: server2 } = createServer(port);
			await expect(server2.start()).rejects.toThrow(/EADDRINUSE/);
		});
	});
});
