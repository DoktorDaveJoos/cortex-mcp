import { App, PluginSettingTab, Setting } from "obsidian";
import type CortexPlugin from "./main";

export class CortexSettingTab extends PluginSettingTab {
	plugin: CortexPlugin;

	constructor(app: App, plugin: CortexPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Port")
			.setDesc("HTTP port for the MCP server (requires restart)")
			.addText((text) =>
				text
					.setPlaceholder("27182")
					.setValue(String(this.plugin.settings.port))
					.onChange(async (value) => {
						const port = parseInt(value, 10);
						if (!isNaN(port) && port > 0 && port < 65536) {
							this.plugin.settings.port = port;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName("Auto-start")
			.setDesc("Start the MCP server automatically when Obsidian launches")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoStart)
					.onChange(async (value) => {
						this.plugin.settings.autoStart = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Claude Code setup")
			.setDesc("Copy the command to register Cortex with Claude Code")
			.addButton((button) =>
				button.setButtonText("Copy /mcp add command").onClick(() => {
					const cmd = `/mcp add cortex --transport http --url http://127.0.0.1:${this.plugin.settings.port}/mcp`;
					navigator.clipboard.writeText(cmd);
					button.setButtonText("Copied!");
					setTimeout(() => button.setButtonText("Copy /mcp add command"), 2000);
				})
			);
	}
}
