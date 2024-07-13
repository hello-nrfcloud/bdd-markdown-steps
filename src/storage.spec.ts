import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { runFolder } from '@bifravst/bdd-markdown'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { steps } from './storage.js'
const __dirname = fileURLToPath(new URL('.', import.meta.url))

void describe('storage', () => {
	void it('should store strings in the context', async () => {
		const runner = await runFolder({
			folder: path.join(__dirname, 'test-data', 'storage'),
			name: 'Example',
		})
		runner.addStepRunners(...steps)
		const ctx = {}
		const then = Date.now()
		const result = await runner.run(ctx)
		assert.equal(result.ok, true)
		assert.equal(
			'ts' in ctx && typeof ctx.ts === 'number' && ctx.ts >= then,
			true,
		)
	})
})
