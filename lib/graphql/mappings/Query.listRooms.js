export function request(ctx) {
	let limit = 100
	if (ctx.args.limit) {
		limit = ctx.args.limit
	}

	const listRequest = {
		version: '2018-05-29',
		operation: 'Scan',
		limit: limit,
	}

	if (ctx.args.nextToken) {
		listRequest.nextToken = ctx.args.nextToken
	}

	return JSON.stringify(listRequest)
}

export function response(ctx) {
	return JSON.stringify(ctx.result)
}
