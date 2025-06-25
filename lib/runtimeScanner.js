export function scanExpressStack(app) {
	const endpoints = [];
	const stack = app._router?.stack || [];

	stack.forEach(layer => {
		if (layer.route) {
			const path = layer.route.path;
			const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
			endpoints.push({ path, methods });
		}
		if (layer.name === 'router' && layer.handle.stack) {
			const nested = scanExpressStack({ _router: layer.handle });
			nested.forEach(e => {
				endpoints.push({ ...e });
			});
		}
	});
	return endpoints;
}
