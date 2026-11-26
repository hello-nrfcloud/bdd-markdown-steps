import { ScanCommand, type DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'
import { runFolder } from '@bifravst/bdd-markdown'
import assert from 'node:assert/strict'
import path from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { steps } from './httpApiMock.ts'
const __dirname = fileURLToPath(new URL('.', import.meta.url))

void describe('HTTP API Mock', () => {
	void it('should match request header names case-insensitively', async () => {
		const db = {
			send: async (command: unknown) => {
				assert.ok(command instanceof ScanCommand)
				return {
					Items: [
						marshall({
							requestId: 'request-1',
							timestamp: new Date().toISOString(),
							method: 'POST',
							path: 'webhook',
							headers: JSON.stringify({
								'content-type': 'application/json; charset=utf-8',
								'x-api-key': 'secret',
							}),
							body: JSON.stringify({ foo: 'bar' }),
						}),
					],
				}
			},
		} as unknown as DynamoDBClient

		const runner = await runFolder({
			folder: path.join(__dirname, 'test-data', 'httpApiMock'),
			name: 'HTTP API Mock',
		})
		runner.addStepRunners(
			...steps({
				db,
				responsesTableName: 'responses',
				requestsTableName: 'requests',
				httpMockApiURL: new URL('https://mock.example.com/'),
			}),
		)
		const result = await runner.run({})
		assert.equal(result.ok, true)
	})
})
