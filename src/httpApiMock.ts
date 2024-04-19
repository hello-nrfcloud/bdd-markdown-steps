import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
	codeBlockOrThrow,
	regExpMatchedStep,
	type StepRunner,
} from '@nordicsemiconductor/bdd-markdown'
import { Type } from '@sinclair/typebox'
import { parseMockResponse } from '@bifravst/http-api-mock/parseMockResponse'
import { registerResponse } from '@bifravst/http-api-mock/responses'
import { parseMockRequest } from '@bifravst/http-api-mock/parseMockRequest'
import { listRequests } from '@bifravst/http-api-mock/requests'
import { check, objectMatching } from 'tsmatchers'
import pRetry from 'p-retry'

export const steps = ({
	db,
	responsesTableName,
	requestsTableName,
	httpMockApiURL,
}: {
	db: DynamoDBClient
	responsesTableName: string
	requestsTableName: string
	httpMockApiURL: URL
}): StepRunner<Record<string, any>>[] => {
	return [
		regExpMatchedStep(
			{
				regExp:
					/^this HTTP API Mock response for `(?<methodHostPathQuery>[A-Z]+ http?s:\/\/[^`]+)` is queued$/,
				schema: Type.Object({
					methodHostPathQuery: Type.String(),
				}),
			},
			async ({ match: { methodHostPathQuery }, log: { progress }, step }) => {
				const [method, hostPathQuery] = methodHostPathQuery.split(' ')
				if (method === undefined) throw new Error(`Method is undefined!`)
				if (hostPathQuery === undefined)
					throw new Error(`Resource is undefined!`)
				const pathWithQuery = hostPathQuery.replace(
					httpMockApiURL.toString().replace(/\/+$/, ''),
					'',
				)
				progress(`expected query: ${pathWithQuery}`)
				const [resource, query] = pathWithQuery.split('?', 2)
				if (resource === undefined) throw new Error(`Resource is undefined!`)
				if (!resource.startsWith('/'))
					throw new Error(`Resource must start with /`)

				const expectedResponse = codeBlockOrThrow(step).code
				const response = parseMockResponse(expectedResponse)
				const body: string[] = [
					...Object.entries(response.headers).map(([k, v]) => `${k}: ${v}`),
				].filter((v) => v)
				if (response.body.length > 0) {
					body.push(``, response.body)
				}

				await registerResponse(db, responsesTableName, {
					method,
					path: resource.slice(1),
					body: body.length > 0 ? body.join('\n') : undefined,
					queryParams:
						query !== undefined ? new URLSearchParams(query) : undefined,
					statusCode: response.statusCode,
				})
			},
		),
		{
			match: (title) =>
				/^the HTTP API Mock should have been called with$/.test(title),
			run: async ({ log: { progress }, step }) => {
				const expectedRequest = codeBlockOrThrow(step).code
				const { method, resource, headers, body } =
					parseMockRequest(expectedRequest)

				const seenRequests: Array<string> = []

				await pRetry(
					async () => {
						for (const request of await listRequests(db, requestsTableName)) {
							if (seenRequests.includes(request.requestId)) continue
							seenRequests.push(request.requestId)
							try {
								check(request.method).is(method)
								check(request.path).is(resource.slice(1))
								check(request.headers).is(objectMatching(headers))
								const isJSON =
									Object.entries(request.headers)
										.map(([k, v]) => [k.toLowerCase(), v])
										.find(
											([k, v]) =>
												k === 'content-type' && v?.includes('application/json'),
										) !== undefined
								if (isJSON) {
									progress('Body is JSON')
									check(JSON.parse(request.body)).is(
										objectMatching(JSON.parse(body)),
									)
								} else {
									check(request.body).is(body)
								}

								return
							} catch (err) {
								progress(`No match: ${(err as Error).message}`)
								progress(JSON.stringify(request))
							}
						}
						throw new Error(`No matching request found!`)
					},
					{
						retries: 5,
						minTimeout: 5000,
						maxTimeout: 10000,
					},
				)
			},
		},
	]
}
