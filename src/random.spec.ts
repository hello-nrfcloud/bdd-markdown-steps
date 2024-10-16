import { runFolder } from '@bifravst/bdd-markdown'
import assert from 'node:assert/strict'
import path from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { email, IMEI, steps, UUIDv4 } from './random.js'
const __dirname = fileURLToPath(new URL('.', import.meta.url))

void describe('Random', () => {
	void it('should store random strings in the context', async () => {
		const runner = await runFolder({
			folder: path.join(__dirname, 'test-data', 'random'),
			name: 'Random',
		})
		runner.addStepRunners(
			...steps({
				UUIDv4,
				email,
				IMEI,
				color: () => 'red',
			}),
		)
		const ctx = {}
		const result = await runner.run(ctx)
		assert.equal(result.ok, true)
		assert.equal(
			'email' in ctx &&
				typeof ctx.email === 'string' &&
				/.+@.+/.test(ctx.email),
			true,
		)
		assert.equal(
			'uuid' in ctx &&
				typeof ctx.uuid === 'string' &&
				/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i.test(
					ctx.uuid,
				),
			true,
		)
		assert.equal(
			'imei' in ctx &&
				typeof ctx.imei === 'string' &&
				parseInt(ctx.imei, 10) >= 350006660000000,
			true,
		)
		assert.equal('color' in ctx && ctx.color, 'red')
	})
})
