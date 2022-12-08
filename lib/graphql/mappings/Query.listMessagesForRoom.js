const { util } = require('@aws-appsync/utils')

export function request(ctx) {
	const ddbRoomID = JSON.stringify(util.dynamodb.toDynamoDB(ctx.args.roomId))
	const statement = {
		version: '2017-02-28',
		operation: 'Query',
		index: 'messages-by-room-id',
		query: {
			expression: 'roomId = :roomId',
			expressionValues: {
				':roomId': ddbRoomID,
			},
		},
	}

	if (ctx.args.sortDirection && ctx.args.sortDirection === 'DESC') {
		statement.scanIndexForward = false
	} else {
		statement.scanIndexForward = true
	}

	if (ctx.args.nextToken) {
		statement.nextToken = ctx.args.nextToken
	}

	return JSON.stringify(statement)
}

export function response(ctx) {
	return JSON.stringify(ctx.result)
}
