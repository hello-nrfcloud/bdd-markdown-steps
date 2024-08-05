import {
	codeBlockOrThrow,
	regExpMatchedStep,
	type StepRunner,
} from '@bifravst/bdd-markdown'
import { Type } from '@sinclair/typebox'
import jsonata from 'jsonata'
import { check, objectMatching } from 'tsmatchers'
import { doRequest } from './lib/doRequest.js'
import assert from 'node:assert/strict'

let currentRequest: ReturnType<typeof doRequest> = {
	match: async () => Promise.reject(new Error(`No request pending!`)),
}

let nextRequestHeaders: Headers = new Headers()

export const steps: StepRunner<Record<string, any>>[] = [
	regExpMatchedStep(
		{
			regExp:
				/^I `(?<method>GET|POST|PUT|PATCH|DELETE)`( to)? `(?<endpoint>https?:\/\/[^`]+)`(?: retrying (?<retry>[0-9]+) times)?(?<withPayload> with)?$/,
			schema: Type.Object({
				method: Type.Union([
					Type.Literal('GET'),
					Type.Literal('POST'),
					Type.Literal('PUT'),
					Type.Literal('PATCH'),
					Type.Literal('DELETE'),
				]),
				endpoint: Type.String({ minLength: 1 }),
				withPayload: Type.Optional(Type.Literal(' with')),
				retry: Type.Optional(Type.String({ minLength: 1 })),
			}),
		},
		async ({ match: { method, endpoint, withPayload, retry }, log, step }) => {
			const url = new URL(endpoint)

			const headers: Headers = new Headers({
				Accept: 'application/json',
			})
			for (const [key, value] of nextRequestHeaders.entries()) {
				headers.set(key, value)
			}
			nextRequestHeaders = new Headers()

			let bodyAsString: string | undefined = undefined
			if (withPayload !== undefined) {
				bodyAsString = JSON.stringify(JSON.parse(codeBlockOrThrow(step).code))
				headers.set('content-type', 'application/json')
			}

			currentRequest = doRequest(
				url,
				{
					method,
					body: bodyAsString,
					headers,
				},
				log,
				undefined,
				{
					numTries: retry === undefined ? undefined : parseInt(retry, 10),
				},
			)
		},
	),
	regExpMatchedStep(
		{
			regExp:
				/^the `(?<header>[^`]+)` header of the next request is `(?<value>[^`]+)`$/,
			schema: Type.Object({
				header: Type.String({ minLength: 1 }),
				value: Type.String({ minLength: 1 }),
			}),
		},
		async ({ match: { header, value }, log: { debug } }) => {
			debug(header, value)
			nextRequestHeaders.set(header, value)
		},
	),
	regExpMatchedStep(
		{
			regExp: /^I should receive a `(?<context>https?:\/\/[^`]+)` response$/,
			schema: Type.Object({
				context: Type.String({ minLength: 1 }),
			}),
		},
		async ({ match: { context } }) => {
			await currentRequest.match(async ({ body }) =>
				check(body).is(
					objectMatching({
						'@context': context,
					}),
				),
			)
		},
	),
	regExpMatchedStep(
		{
			regExp:
				/^the status code of the last response should be `(?<statusCode>[^`]+)`$/,
			schema: Type.Object({
				statusCode: Type.RegExp(/^\d+$/),
			}),
		},
		async ({ match: { statusCode } }) => {
			await currentRequest.match(async ({ response }) =>
				check(parseInt(statusCode, 10)).is(response.status),
			)
		},
	),
	regExpMatchedStep(
		{
			regExp:
				/^I store `(?<exp>[^`]+)` of the last response into `(?<storeName>[^`]+)`$/,
			schema: Type.Object({
				exp: Type.String(),
				storeName: Type.String(),
			}),
		},
		async ({ match: { exp, storeName }, context }) => {
			await currentRequest.match(async ({ body }) => {
				const e = jsonata(exp)
				const result = await e.evaluate(body)
				assert.notEqual(result, undefined)
				context[storeName] = result
			})
		},
	),
	regExpMatchedStep(
		{
			regExp: /^(?:`(?<exp>[^`]+)` of )?the last response should match$/,
			schema: Type.Object({
				exp: Type.Optional(Type.String()),
			}),
		},
		async ({ step, match: { exp } }) => {
			const expected = JSON.parse(codeBlockOrThrow(step).code)
			await currentRequest.match(async ({ body }) => {
				if (exp !== undefined) {
					const e = jsonata(exp)
					const result = await e.evaluate(body)
					check(result).is(objectMatching(expected))
				} else {
					check(body).is(objectMatching(expected))
				}
			})
		},
	),
]
