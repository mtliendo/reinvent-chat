const { util } = require('@aws-appsync/utils')

export function request(ctx) {
	const id = JSON.stringify(util.dynamodb.toDynamoDB(ctx.args.input.id))
	const updatedAt = JSON.stringify(
		util.dynamodb.toDynamoDB(util.time.nowISO8601())
	)
	const content = JSON.stringify(
		util.dynamodb.toDynamoDB(ctx.args.input.content)
	)

	return JSON.stringify({
		version: '2018-05-29',
		operation: 'UpdateItem',
		key: {
			id,
		},
		update: {
			expression: 'SET #updatedAt = :updatedAt, #content = :content',
			expressionNames: {
				'#updatedAt': 'updatedAt',
				'#content': 'content',
			},
			expressionValues: {
				':updatedAt': updatedAt,
				':content': content,
			},
		},
	})
}

export function response(ctx) {
	return JSON.stringify(ctx.result)
}
