import {
	QueryCommand,
	ScanCommand,
	type DynamoDBClient,
} from '@aws-sdk/client-dynamodb'
import { GetParametersByPathCommand, type SSMClient } from '@aws-sdk/client-ssm'
import { marshall } from '@aws-sdk/util-dynamodb'
import { runFolder } from '@bifravst/bdd-markdown'
import assert from 'node:assert/strict'
import path from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { steps } from './mocknRFCloud.ts'
const __dirname = fileURLToPath(new URL('.', import.meta.url))

const stackName = 'test-stack'
const prefix = 'nrfcloud-api'
const apiKey = 'elite-api-key'

const ssm = {
	send: async (command: unknown) => {
		assert.ok(command instanceof GetParametersByPathCommand)
		const settingsPath = `/${stackName}/thirdParty`
		return {
			Parameters: Object.entries({
				apiKey,
				accountDeviceClientCert: 'cert',
				accountDevicePrivateKey: 'key',
				accountDeviceClientId: 'client-id',
				mqttTopicPrefix: 'prod/elite/',
				mqttEndpoint: 'mqtt.example.com',
			}).map(([property, Value]) => ({
				Name: `${settingsPath}/elite/${property}`,
				Value,
			})),
		}
	},
} as unknown as SSMClient

const db = {
	send: async (command: unknown) => {
		// the nRF Cloud API should have been called with
		if (command instanceof QueryCommand)
			return {
				Items: [
					marshall({
						body: JSON.stringify({ desired: { foo: 'bar' } }),
						headers: JSON.stringify({
							'Content-Type': 'application/json',
							'X-Request-ID': '42',
						}),
					}),
				],
			}
		// the shadow for `some-device` in the `elite` account has been requested
		if (command instanceof ScanCommand)
			return {
				Items: [
					marshall({
						timestamp: new Date().toISOString(),
						query: {
							includeState: 'true',
							includeStateMeta: 'true',
							pageLimit: '100',
							deviceIds: 'some-device',
						},
						headers: JSON.stringify({
							authorization: `Bearer ${apiKey}`,
						}),
					}),
				],
			}
		throw new Error(`Unexpected command: ${command?.constructor.name}`)
	},
} as unknown as DynamoDBClient

void describe('nRF Cloud API mock', () => {
	void it('should match request header names case-insensitively', async () => {
		const runner = await runFolder({
			folder: path.join(__dirname, 'test-data', 'mocknRFCloud'),
			name: 'nRF Cloud API mock',
		})
		runner.addStepRunners(
			...steps({
				db,
				responsesTableName: 'responses',
				requestsTableName: 'requests',
				ssm,
				stackName,
				prefix,
			}),
		)
		const result = await runner.run({})
		assert.equal(result.ok, true)
	})
})
