import {
	AppsyncFunction,
	BaseDataSource,
	EnumType,
	IAppsyncFunction,
	IGraphqlApi,
	NoneDataSource,
	Resolver,
} from '@aws-cdk/aws-appsync-alpha'
import { CfnFunctionConfiguration, CfnResolver } from 'aws-cdk-lib/aws-appsync'
import { Construct } from 'constructs'

export type CreateFunctionProps = {
	scope: Construct
	name: string
	api: IGraphqlApi
	dataSource: BaseDataSource
	code: string
}

export type CreatePipelineProps = {
	scope: Construct
	api: IGraphqlApi
	dataSource: BaseDataSource
	code: string
	id: string
	typeName: string
	fieldName: string
	pipelineConfig: IAppsyncFunction[]
}

export type ExpressPipelineProps = {
	scope: Construct
	functionName?: string
	fieldName: string
	typeName: 'Query' | 'Mutation' | 'Subscription'
	api: IGraphqlApi
	code: string
	dataSource: BaseDataSource
	pipelineId?: string
	pipelineDataSource: NoneDataSource
}

// Note: The `id` field is set to be the same as the `name`.
export function createFunction(config: CreateFunctionProps) {
	const createdFunction = new AppsyncFunction(config.scope, config.name, {
		name: config.name,
		api: config.api,
		dataSource: config.dataSource,
	})

	// Escape hatch to access L1 construct
	const cfnCreateRoomFunc = createdFunction.node
		.defaultChild as CfnFunctionConfiguration

	cfnCreateRoomFunc.runtime = {
		name: 'APPSYNC_JS',
		runtimeVersion: '1.0.0',
	}
	cfnCreateRoomFunc.code = config.code

	return createdFunction
}

export function createPipeline(config: CreatePipelineProps) {
	const pipelineResolver = new Resolver(config.scope, config.id, {
		api: config.api,
		dataSource: config.dataSource,
		typeName: config.typeName,
		fieldName: config.fieldName,
		pipelineConfig: config.pipelineConfig,
	})

	const cfnPipeline = pipelineResolver.node.defaultChild as CfnResolver
	cfnPipeline.runtime = {
		name: 'APPSYNC_JS',
		runtimeVersion: '1.0.0',
	}
	cfnPipeline.code = config.code

	return pipelineResolver
}

export function expressPipeline(config: ExpressPipelineProps) {
	const createdFunction = new AppsyncFunction(
		config.scope,
		config.functionName || `${config.fieldName}Function`,
		{
			name: config.functionName || `${config.fieldName}Function`,
			api: config.api,
			dataSource: config.dataSource,
		}
	)

	// Escape hatch to access L1 construct
	const cfnCreateRoomFunc = createdFunction.node
		.defaultChild as CfnFunctionConfiguration

	cfnCreateRoomFunc.runtime = {
		name: 'APPSYNC_JS',
		runtimeVersion: '1.0.0',
	}
	cfnCreateRoomFunc.code = config.code

	const pipelineResolver = new Resolver(
		config.scope,
		config.pipelineId || `${config.fieldName}Pipeline`,
		{
			api: config.api,
			dataSource: config.pipelineDataSource,
			typeName: config.typeName,
			fieldName: config.fieldName,
			pipelineConfig: [createdFunction],
		}
	)

	const cfnPipeline = pipelineResolver.node.defaultChild as CfnResolver
	cfnPipeline.runtime = {
		name: 'APPSYNC_JS',
		runtimeVersion: '1.0.0',
	}
	cfnPipeline.code = `
    // The before step
    export function request() {
      return {}
    }

    // The after step
    export function response(ctx) {
      return ctx.prev.result
    }
`

	return {
		function: createdFunction,
		expressPipeline: pipelineResolver,
	}
}
