import { parse } from "@babel/parser";
import babelTraverse from "@babel/traverse";
const traverse = babelTraverse.default;

function inferLiteralType(node) {
	switch (node.type) {
		case "StringLiteral":
		case "Literal":
			return "string";
		case "NumericLiteral":
			return "number";
		case "BooleanLiteral":
			return "boolean";
		case "ObjectExpression":
			return "object";
		case "ArrayExpression":
			return "array";
		default:
			return "string";
	}
}

function extractObjectSchema(node) {
	const schema = { type: "object", properties: {} };

	node.properties.forEach((prop) => {
		if (!prop.key || !prop.value) return;

		if (prop.value.type === "ObjectExpression") {
			schema.properties[prop.key.name] = extractObjectSchema(
				prop.value
			);
		} else {
			schema.properties[prop.key.name] = {
				type: inferLiteralType(prop.value),
			};
		}
	});

	return schema;
}

export async function extractControllerMetadata(
	filePath,
	{ includeJSDoc = false, includeAuth = false } = {}
) {
	const fs = await import("fs");
	const code = fs.readFileSync(filePath, "utf8");
	const ast = parse(code, {
		sourceType: "module",
		plugins: ["typescript", "jsx"],
	});

	const controllers = [];

	traverse(ast, {
		FunctionDeclaration(path) {
			const name = path.node.id?.name || "anonymous";
			const meta = {
				name,
				uses: [],
				bodyKeys: [],
				responseShape: {},
				jsDoc: "",
				hasAuth: false,
			};

			// Handle JSDoc if needed
			if (includeJSDoc && path.node.leadingComments) {
				const comment = path.node.leadingComments
					.map((c) => c.value.trim())
					.find((c) => c.startsWith("*"));
				meta.jsDoc = comment || "";
			}

			path.traverse({
				MemberExpression(p) {
					const { object, property } = p.node;
					if (
						object.name === "req" &&
						["params", "query", "body"].includes(
							property.name
						)
					) {
						if (!meta.uses.includes(property.name)) {
							meta.uses.push(property.name);
						}
					}
					if (
						object.name === "res" &&
						["json", "send"].includes(property.name)
					) {
						meta.returns = true;
					}
				},
				VariableDeclarator(p) {
					const init = p.node.init;
					if (
						init?.type === "MemberExpression" &&
						init.object.name === "req" &&
						init.property.name === "body" &&
						p.node.id.type === "ObjectPattern"
					) {
						const keys = p.node.id.properties.map(
							(prop) => prop.key.name
						);
						meta.bodyKeys.push(...keys);
					}
				},
				CallExpression(p) {
					const callee = p.node.callee;

					if (
						callee.type === "MemberExpression" &&
						callee.object.name === "res" &&
						callee.property.name === "json" &&
						p.node.arguments.length === 1 &&
						p.node.arguments[0].type ===
							"ObjectExpression"
					) {
						meta.responseShape = extractObjectSchema(
							p.node.arguments[0]
						);
					}

					if (
						includeAuth &&
						callee.name === "next" &&
						p.node.arguments?.[0]?.name ===
							"UnauthorizedError"
					) {
						meta.hasAuth = true;
					}
				},
			});

			controllers.push(meta);
		},
	});

	return controllers;
}
