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
			.setDesc("Server port (requires restart)")
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
			.setDesc("Start the server automatically when Obsidian launches")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoStart)
					.onChange(async (value) => {
						this.plugin.settings.autoStart = value;
						await this.plugin.saveSettings();
					})
			);

		const mcpUrl = `http://127.0.0.1:${this.plugin.settings.port}/mcp`;

		const addCopyButton = (
			name: string,
			desc: string,
			label: string,
			getText: () => string
		) => {
			new Setting(containerEl)
				.setName(name)
				.setDesc(desc)
				.addButton((button) =>
					button.setButtonText(label).onClick(() => {
						void navigator.clipboard.writeText(getText());
						button.setButtonText("Copied!");
						setTimeout(() => { button.setButtonText(label); }, 2000);
					})
				);
		};

		addCopyButton(
			"Claude Code setup",
			"Copy the command to register Cortex with Claude Code",
			"Copy /mcp add command",
			() => `/mcp add cortex --transport http --url ${mcpUrl}`
		);

		addCopyButton(
			"Codex setup",
			"Copy the TOML config to add to .codex/config.toml",
			"Copy TOML config",
			() =>
				`[mcp_servers.cortex]\ntype = "remote"\nurl = "${mcpUrl}"`
		);

		addCopyButton(
			"OpenCode setup",
			"Copy the JSON config to add to opencode.json",
			"Copy JSON config",
			() =>
				JSON.stringify(
					{ mcp: { cortex: { type: "remote", url: mcpUrl } } },
					null,
					2
				)
		);
	}
}
