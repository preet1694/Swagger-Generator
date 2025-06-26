import fs from "fs";
import * as acorn from "acorn";

export function parseRouteFile(filePath) {
	const code = fs.readFileSync(filePath, "utf8");
	const ast = acorn.parse(code, {
		ecmaVersion: "latest",
		sourceType: "module",
	});

	const routes = [];

	function walk(node, callback) {
		callback(node);
		for (const key in node) {
			const value = node[key];
			if (Array.isArray(value)) {
				value.forEach(
					(n) =>
						n &&
						typeof n.type === "string" &&
						walk(n, callback)
				);
			} else if (value && typeof value.type === "string") {
				walk(value, callback);
			}
		}
	}

	walk(ast, (node) => {
		if (
			node.type === "CallExpression" &&
			node.callee?.type === "MemberExpression" &&
			["get", "post", "put", "delete"].includes(
				node.callee.property.name
			)
		) {
			const method = node.callee.property.name.toUpperCase();
			const path = node.arguments?.[0]?.value;

			const middlewares = node.arguments.slice(1, -1); // Middlewares (before handler)
			const handler = node.arguments[node.arguments.length - 1];

			const hasAuthMiddleware = middlewares.some((mw) => {
				return (
					mw.type === "Identifier" &&
					[
						"auth",
						"authenticate",
						"authMiddleware",
					].includes(mw.name)
				);
			});

			if (
				typeof path === "string" &&
				handler?.type === "Identifier"
			) {
				routes.push({
					method,
					path,
					handlerName: handler.name,
					requiresAuth: hasAuthMiddleware,
				});
			}
		}
	});

	return routes;
}
