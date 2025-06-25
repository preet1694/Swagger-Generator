import { readAllJsFiles } from "./lib/fileUtils.js";
import { parseRouteFile } from "./lib/routeParser.js";
import { extractControllerMetadata } from "./lib/controllerParser.js";
import { toSwagger } from "./lib/swaggerBuilder.js";
import { extractSwaggerFromJsdoc } from "./lib/jsdocParser.js";

export async function generateSwagger({
	routesDir,
	controllersDir,
	includeAuth = false,
	preferJsdoc = false,
}) {
	const routeFiles = readAllJsFiles(routesDir);
	const controllerFiles = readAllJsFiles(controllersDir);

	if (preferJsdoc) {
		// Combine all YAML-based @swagger blocks
		const docs = routeFiles.flatMap(extractSwaggerFromJsdoc);
		return mergeSwaggerBlocks(docs); // helper below
	}

	const endpoints = routeFiles.flatMap(parseRouteFile);
	const metadataArr = await Promise.all(
		controllerFiles.map((f) =>
			extractControllerMetadata(f, { includeAuth })
		)
	);
	const controllerMap = Object.fromEntries(
		metadataArr.flat().map((m) => [m.name, m])
	);
	return toSwagger(endpoints, controllerMap);
}

function mergeSwaggerBlocks(blocks) {
	const result = {
		openapi: "3.0.0",
		info: { title: "Express API", version: "1.0.0" },
		paths: {},
		components: {
			schemas: {
				User: {
					type: "object",
					properties: {
						id: { type: "string" },
						name: { type: "string" },
						email: { type: "string", format: "email" },
					},
				},
				AuthTokens: {
					type: "object",
					properties: {
						access: { type: "string" },
						refresh: { type: "string" },
					},
				},
				Error: {
					type: "object",
					properties: {
						code: { type: "integer" },
						message: { type: "string" },
					},
				},
			},
			responses: {
				Unauthorized: { description: "Authentication failed" },
				Forbidden: { description: "Access denied" },
				NotFound: { description: "Resource not found" },
				DuplicateEmail: { description: "Email already exists" },
			},
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
		},
	};

	for (const block of blocks) {
		for (const [path, methods] of Object.entries(block)) {
			result.paths[path] = {
				...(result.paths[path] || {}),
				...methods,
			};
		}
	}

	return result;
}
