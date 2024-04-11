import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { runFolder } from '@nordicsemiconductor/bdd-markdown'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { steps } from './REST.js'
import nock from 'nock'
const __dirname = fileURLToPath(new URL('.', import.meta.url))

void describe('REST', () => {
	void it('should implement a REST client', async () => {
		const scope = nock(`https://api.example.com`)
			.get('/foo', undefined, {
				reqheaders: {
					Accept: 'application/json',
				},
			})
			.reply(
				200,
				{
					'@context':
						'https://github.com/hello-nrfcloud/bdd-markdown-steps/tests',
					success: true,
				},
				{
					'content-type': 'application/json; charset=utf-8',
				},
			)

		const runner = await runFolder({
			folder: path.join(__dirname, 'test-data', 'REST'),
			name: 'REST',
		})
		runner.addStepRunners(...steps)
		const ctx = {
			endpoint: `https://api.example.com`,
		}
		const result = await runner.run(ctx)
		assert.equal(result.ok, true)
		assert.equal(scope.isDone(), true)
	})

	void afterEach(() => nock.cleanAll())
})
