#!/usr/bin/env node

import { program } from "commander";
import fs from "fs";
import path from "path";
import { generateSwagger } from "./index.js";
import yaml from "js-yaml";

program
	.argument("<routesDir>", "Path to routes directory")
	.argument("<controllersDir>", "Path to controllers directory")
	.option("--out <file>", "Output file path")
	.option("--format <format>", "Output format: json or yaml", "json")
	.option(
		"--preferJsdoc",
		"Prefer JSDoc @swagger blocks over AST detection",
		false
	)
	.option("--includeAuth", "Include auth middleware detection", false)
	.action(async (routesDir, controllersDir, options) => {
		const swagger = await generateSwagger({
			routesDir: path.resolve(routesDir),
			controllersDir: path.resolve(controllersDir),
			includeAuth: options.includeAuth,
			preferJsdoc: options.preferJsdoc,
		});

		const output =
			options.format === "yaml"
				? yaml.dump(swagger)
				: JSON.stringify(swagger, null, 2);

		if (options.out) {
			fs.writeFileSync(path.resolve(options.out), output, "utf8");
			console.log(
				`✅ Swagger documentation saved to ${options.out}`
			);
		} else {
			console.log(output);
		}
	});

program.parse();
