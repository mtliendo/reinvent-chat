import { util } from '@aws-appsync/utils'

export function request(ctx) {
	const id = util.autoId()
	const owner = ctx.identity.username
	const createdAt = util.time.nowISO8601()
	const updatedAt = util.time.nowISO8601()

	ctx.args.input = {
		...ctx.args.input,
		id,
		owner,
		createdAt,
		updatedAt,
	}

	return JSON.stringify({
		version: '2018-05-29',
		operation: 'PutItem',
		key: { id: util.dynamodb.toDynamoDB(ctx.args.input.id) },
		attributeValues: util.dynamodb.toMapValues(ctx.args.input),
	})
}

export function response(ctx) {
	return JSON.stringify(ctx.result)
}
