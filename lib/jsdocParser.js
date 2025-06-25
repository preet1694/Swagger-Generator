import fs from "fs";
import { parse as babelParse } from "@babel/parser";
import { parse as parseComments } from "comment-parser";
import yaml from "js-yaml";

export function extractSwaggerFromJsdoc(filePath) {
	const code = fs.readFileSync(filePath, "utf8");
	const ast = babelParse(code, {
		sourceType: "module",
		plugins: ["jsx", "typescript"],
		allowReturnOutsideFunction: true,
		attachComment: true,
		ranges: true,
		tokens: true,
	});

	const jsdocBlocks = ast.comments || [];
	const swaggerPaths = [];

	for (const block of jsdocBlocks) {
		if (
			block.type === "CommentBlock" &&
			/@swagger|@openapi/.test(block.value)
		) {
			const yamlLines = block.value
				.split("\n")
				.map((line) =>
					line
						.replace(/^\s*\* ?/, "")
						.replace(/^@swagger\s?/, "")
						.replace(/^@openapi\s?/, "")
				)
				.join("\n");

			try {
				const doc = yaml.load(yamlLines);
				if (typeof doc === "object") {
					swaggerPaths.push(doc);
				}
			} catch (e) {
				console.warn(
					`⚠️ Failed to parse JSDoc @swagger in ${filePath}: ${e.message}`
				);
			}
		}
	}

	return swaggerPaths;
}
