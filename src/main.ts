import { Notice, Plugin } from "obsidian";
import { CortexSettings, DEFAULT_SETTINGS } from "./types";
import { CortexSettingTab } from "./settings";
import { CortexServer } from "./server";

export default class CortexPlugin extends Plugin {
	settings: CortexSettings = DEFAULT_SETTINGS;
	private server: CortexServer | null = null;
	private statusBarEl: HTMLElement | null = null;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new CortexSettingTab(this.app, this));

		this.statusBarEl = this.addStatusBarItem();
		this.updateStatusBar();

		this.addCommand({
			id: "start-server",
			name: "Start MCP server",
			callback: () => this.startServer(),
		});

		this.addCommand({
			id: "stop-server",
			name: "Stop MCP server",
			callback: () => this.stopServer(),
		});

		if (this.settings.autoStart) {
			this.app.workspace.onLayoutReady(() => this.startServer());
		}
	}

	async onunload() {
		await this.stopServer();
	}

	async startServer() {
		if (this.server?.isRunning) {
			new Notice("Cortex MCP server is already running");
			return;
		}

		try {
			this.server = new CortexServer(this.app, this.settings.port);
			await this.server.start();
			this.updateStatusBar();
			new Notice(`Cortex: listening on :${this.settings.port}`);
		} catch (e) {
			console.error("Cortex: failed to start server", e);
			this.server = null;
			this.updateStatusBar();
		}
	}

	async stopServer() {
		if (!this.server) return;
		await this.server.stop();
		this.server = null;
		this.updateStatusBar();
	}

	private updateStatusBar() {
		if (!this.statusBarEl) return;
		if (this.server?.isRunning) {
			this.statusBarEl.setText(`Cortex: :${this.settings.port}`);
		} else {
			this.statusBarEl.setText("Cortex: off");
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
