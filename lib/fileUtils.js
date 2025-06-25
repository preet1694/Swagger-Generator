import fs from "fs";
import path from "path";

export function readAllJsFiles(dir) {
	const files = [];

	function read(dirPath) {
		const entries = fs.readdirSync(dirPath);
		for (const entry of entries) {
			const fullPath = path.join(dirPath, entry);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				read(fullPath);
			} else if (entry.endsWith(".js") || entry.endsWith(".ts")) {
				files.push(fullPath);
			}
		}
	}

	read(dir);
	return files;
}
