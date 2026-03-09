import esbuild from "esbuild";
import { builtinModules } from "node:module";

const production = process.argv[2] === "production";

esbuild
	.build({
		entryPoints: ["src/main.ts"],
		bundle: true,
		external: [
			"obsidian",
			"electron",
			...builtinModules,
			...builtinModules.map((m) => `node:${m}`),
		],
		format: "cjs",
		platform: "node",
		target: "es2022",
		outfile: "main.js",
		sourcemap: production ? false : "inline",
		minify: production,
		treeShaking: true,
		logLevel: "info",
	})
	.catch(() => process.exit(1));
