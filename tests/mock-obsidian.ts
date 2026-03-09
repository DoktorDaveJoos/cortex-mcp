// Mock Obsidian module for testing outside the Obsidian app.

export class TAbstractFile {
	path: string = "";
	name: string = "";
	parent: TFolder | null = null;
}

export class TFile extends TAbstractFile {
	extension: string = "md";
	basename: string = "";
	stat: { size: number; mtime: number; ctime: number } = {
		size: 0,
		mtime: Date.now(),
		ctime: Date.now(),
	};
}

export class TFolder extends TAbstractFile {
	children: TAbstractFile[] = [];
	isRoot(): boolean {
		return this.path === "/" || this.path === "";
	}
}

export function getAllTags(cache: any): string[] | null {
	if (!cache) return null;
	const tags: string[] = [];
	if (cache.tags) {
		for (const t of cache.tags) tags.push(t.tag);
	}
	if (cache.frontmatter?.tags) {
		for (const t of cache.frontmatter.tags) {
			tags.push(t.startsWith("#") ? t : `#${t}`);
		}
	}
	return tags.length > 0 ? tags : null;
}

export class Notice {
	constructor(_message: string) {}
}

export class Plugin {}
export class PluginSettingTab {}

// --- Test helper: build a mock App from declarative config ---

interface MockAppConfig {
	files?: Record<string, string>; // path -> content
	metadata?: Record<string, any>; // path -> CachedMetadata-like
}

export function createMockApp(config: MockAppConfig = {}): any {
	const fileContents = new Map<string, string>();
	const fileMap = new Map<string, TFile>();
	const folderMap = new Map<string, TFolder>();
	const metadataMap = new Map<string, any>();

	// Polyfill Obsidian's String.prototype.contains used in source code
	if (!(String.prototype as any).contains) {
		(String.prototype as any).contains = String.prototype.includes;
	}

	// Build root folder
	const root = new TFolder();
	root.path = "/";
	root.name = "";
	folderMap.set("/", root);

	function ensureFolderChain(folderPath: string): TFolder {
		if (!folderPath || folderPath === "/" || folderPath === "") return root;
		if (folderMap.has(folderPath)) return folderMap.get(folderPath)!;

		const parts = folderPath.split("/");
		let current = root;
		let currentPath = "";

		for (const part of parts) {
			currentPath = currentPath ? `${currentPath}/${part}` : part;
			if (!folderMap.has(currentPath)) {
				const folder = new TFolder();
				folder.path = currentPath;
				folder.name = part;
				folder.parent = current;
				current.children.push(folder);
				folderMap.set(currentPath, folder);
			}
			current = folderMap.get(currentPath)!;
		}
		return current;
	}

	// Populate files and folders from config
	for (const [path, content] of Object.entries(config.files ?? {})) {
		fileContents.set(path, content);

		const file = new TFile();
		file.path = path;
		file.name = path.split("/").pop()!;
		file.basename = file.name.replace(/\.md$/, "");
		file.extension = "md";
		file.stat = { size: content.length, mtime: 1700000000000, ctime: 1700000000000 };

		const folderPath = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
		const parent = ensureFolderChain(folderPath);
		file.parent = parent;
		parent.children.push(file);

		fileMap.set(path, file);
	}

	// Populate metadata
	for (const [path, meta] of Object.entries(config.metadata ?? {})) {
		metadataMap.set(path, meta);
	}

	const vault = {
		getAbstractFileByPath(path: string): TAbstractFile | null {
			return fileMap.get(path) ?? folderMap.get(path) ?? null;
		},
		getMarkdownFiles(): TFile[] {
			return [...fileMap.values()];
		},
		getRoot(): TFolder {
			return root;
		},
		async read(file: TFile): Promise<string> {
			return fileContents.get(file.path) ?? "";
		},
		async cachedRead(file: TFile): Promise<string> {
			return fileContents.get(file.path) ?? "";
		},
		async modify(file: TFile, content: string): Promise<void> {
			fileContents.set(file.path, content);
		},
		async create(path: string, content: string): Promise<TFile> {
			const file = new TFile();
			file.path = path;
			file.name = path.split("/").pop()!;
			file.basename = file.name.replace(/\.md$/, "");
			file.extension = "md";
			file.stat = { size: content.length, mtime: Date.now(), ctime: Date.now() };

			const folderPath = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
			const parent = ensureFolderChain(folderPath);
			file.parent = parent;
			parent.children.push(file);

			fileContents.set(path, content);
			fileMap.set(path, file);
			return file;
		},
		async createFolder(path: string): Promise<TFolder> {
			return ensureFolderChain(path);
		},
		async delete(file: TFile): Promise<void> {
			fileContents.delete(file.path);
			fileMap.delete(file.path);
			if (file.parent) {
				file.parent.children = file.parent.children.filter((c) => c !== file);
			}
		},
		async trash(file: TFile, _system?: boolean): Promise<void> {
			fileContents.delete(file.path);
			fileMap.delete(file.path);
			if (file.parent) {
				file.parent.children = file.parent.children.filter((c) => c !== file);
			}
		},
	};

	const metadataCache = {
		getFileCache(file: TFile): any | null {
			return metadataMap.get(file.path) ?? null;
		},
	};

	return { vault, metadataCache };
}
