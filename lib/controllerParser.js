import { parse } from "@babel/parser";
import babelTraverse from "@babel/traverse";
const traverse = babelTraverse.default;

function inferLiteralType(node) {
	switch (node.type) {
		case "StringLiteral":
		case "Literal":
			return typeof node.value;
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
						if (!meta.uses.includes(property.name))
							meta.uses.push(property.name);
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
							(p) => p.key.name
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
						p.node.arguments[0].properties.forEach(
							(prop) => {
								if (prop.key && prop.value) {
									meta.responseShape[
										prop.key.name
									] = {
										type: inferLiteralType(
											prop.value
										),
									};
								}
							}
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
