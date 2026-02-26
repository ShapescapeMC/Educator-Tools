function getScriptFiles(dir: string): string[] {
	const files: string[] = [];
	for (const entry of Deno.readDirSync(new URL(dir, import.meta.url))) {
		const path = `${dir}/${entry.name}`;
		if (entry.isDirectory) {
			files.push(...getScriptFiles(path));
		} else if (entry.name.endsWith(".ts")) {
			files.push(path);
		}
	}
	return files;
}

export const SCRIPTS = ["main.ts", ...getScriptFiles("subscripts")];
