import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib'
import { Table } from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'
import * as path from 'path'
import {
	GraphqlApi,
	Schema,
	AuthorizationType,
	FieldLogLevel,
	Resolver,
} from '@aws-cdk/aws-appsync-alpha'
import { UserPool } from 'aws-cdk-lib/aws-cognito'
import * as fs from 'fs'
import { CfnResolver } from 'aws-cdk-lib/aws-appsync'
import {
	createFunction,
	createPipeline,
	expressPipeline,
	GRAPHQL_TYPENAME,
} from './graphql/utils'

interface APIStackProps extends StackProps {
	userpool: UserPool
	roomTable: Table
	messageTable: Table
}

export class APIStack extends Stack {
	constructor(scope: Construct, id: string, props: APIStackProps) {
		super(scope, id, props)

		// Create the AppSync API
		const api = new GraphqlApi(this, 'APIReInvent', {
			name: 'APIReInvent',
			schema: Schema.fromAsset(path.join(__dirname, 'graphql/schema.graphql')),
			authorizationConfig: {
				defaultAuthorization: {
					authorizationType: AuthorizationType.USER_POOL,
					userPoolConfig: {
						userPool: props.userpool,
					},
				},
				additionalAuthorizationModes: [
					{ authorizationType: AuthorizationType.IAM },
				],
			},
			logConfig: {
				fieldLogLevel: FieldLogLevel.ALL,
			},
			xrayEnabled: true,
		})

		// Add DynamoDB tables as datasources for pipeline functions
		const roomTableDataSource = api.addDynamoDbDataSource(
			'RoomTableDataSource',
			props.roomTable
		)
		const messageTableDataSource = api.addDynamoDbDataSource(
			'MessageTableDataSource',
			props.messageTable
		)

		// Add a NONE datasource for the pipeline itself
		const noneDataSource = api.addNoneDataSource('passthrough')

		// listRooms Function with L2 construct + escape hatches

		const listRoomsFunction = createFunction({
			scope: this,
			name: 'listRoomsFunc',
			api,
			code: fs.readFileSync(
				'./graphql/mappings/Mutation.listRooms.js',
				'utf-8'
			),
			dataSource: roomTableDataSource,
		})
		//////////////

		// createMessage Function with L2 construct + escape hatches

		const createMessageFunction = createFunction({
			scope: this,
			name: 'createMessageFunc',
			api,
			code: fs.readFileSync(
				'./graphql/mappings/Mutation.createMessage.js',
				'utf-8'
			),
			dataSource: roomTableDataSource,
		})
		//////////////

		// listMessagesForRoom Function with L2 construct + escape hatches

		const listMessagesForRoomFunction = createFunction({
			scope: this,
			name: 'listMessagesForRoomFunc',
			api,
			code: fs.readFileSync(
				'./graphql/mappings/Mutation.listMessagesForRoom.js',
				'utf-8'
			),
			dataSource: roomTableDataSource,
		})
		//////////////

		// updateMessage Function with L2 construct + escape hatches

		const updateMessageFunction = createFunction({
			scope: this,
			name: 'updateMessageFunc',
			api,
			code: fs.readFileSync(
				'./graphql/mappings/Mutation.updateMessage.js',
				'utf-8'
			),
			dataSource: roomTableDataSource,
		})
		//////////////

		// createRoom Function with L2 construct + escape hatches

		const createRoomFunction = createFunction({
			scope: this,
			name: 'createRoomFunc',
			api,
			code: fs.readFileSync(
				'./graphql/mappings/Mutation.createRoom.js',
				'utf-8'
			),
			dataSource: roomTableDataSource,
		})

		//////////////

		// Create a pipeline resolver with the functions

		const createRoomPipeline = createPipeline({
			scope: this,
			id: 'createRoomPipeline',
			api,
			dataSource: noneDataSource,
			typeName: 'Mutation',
			fieldName: 'createRoom',
			code: fs.readFileSync(
				'./graphql/mappings/Pipeline.passThrough.js',
				'utf-8'
			),
			pipelineConfig: [createRoomFunction],
		})

		const sampleExpress = expressPipeline({
			scope: this,
			api,
			code: 'some_file_path',
			dataSource: roomTableDataSource,
			fieldName: 'createSample',
			typeName: GRAPHQL_TYPENAME.Mutation,
			pipelineDataSource: roomTableDataSource,
		})
		new CfnOutput(this, 'GraphQLAPIURL', {
			value: api.graphqlUrl,
		})

		new CfnOutput(this, 'GraphQLAPIID', {
			value: api.apiId,
		})
	}
}
