export function toSwagger(endpoints, controllerMap = {}) {
	const paths = {};

	endpoints.forEach((ep) => {
		const pathKey = ep.path.replace(/:([a-zA-Z]+)/g, "{$1}");
		paths[pathKey] ||= {};

		const controller = controllerMap[ep.handlerName] || {};
		const parameters = [];

		if (controller?.uses?.includes("params")) {
			(pathKey.match(/{(.*?)}/g) || []).forEach((p) => {
				parameters.push({
					name: p.replace(/[{}]/g, ""),
					in: "path",
					required: true,
					schema: { type: "string" },
				});
			});
		}

		if (controller?.uses?.includes("query")) {
			parameters.push({
				name: "query",
				in: "query",
				required: false,
				schema: { type: "object" },
			});
		}

		const operation = {
			summary: controller.jsDoc || `${ep.method} ${ep.path}`,
			tags: [ep.handlerName],
			parameters,
			responses: {
				200: {
					description: "Success",
				},
			},
		};

		if (controller?.bodyKeys?.length) {
			operation.requestBody = {
				required: true,
				content: {
					"application/json": {
						schema: {
							type: "object",
							properties: Object.fromEntries(
								controller.bodyKeys.map((k) => [
									k,
									{ type: "string" },
								])
							),
						},
					},
				},
			};
		}

		if (
			controller?.responseShape &&
			Object.keys(controller.responseShape).length > 0
		) {
			operation.responses["200"].content = {
				"application/json": {
					schema: controller.responseShape,
				},
			};
		}

		if (controller.hasAuth) {
			operation.security = [{ bearerAuth: [] }];
		}

		paths[pathKey][ep.method.toLowerCase()] = operation;
	});

	return {
		openapi: "3.0.0",
		info: {
			title: "API Documentation",
			version: "1.0.0",
		},
		paths,
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
				},
			},
		},
	};
}
