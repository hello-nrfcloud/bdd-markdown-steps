import { runFolder } from '@bifravst/bdd-markdown'
import nock from 'nock'
import assert from 'node:assert/strict'
import path from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { steps } from './REST.ts'
const __dirname = fileURLToPath(new URL('.', import.meta.url))

void describe('REST', () => {
	void it('should implement a REST client', async () => {
		const scope = nock(`https://api.example.com`)

		scope
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
					'content-length': '42',
				},
			)

		scope
			.post('/bar', undefined, {
				reqheaders: {
					Authorization: 'Bearer BAR',
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
					'content-length': '42',
				},
			)

		scope.get('/header-response').reply(200, undefined, {
			'x-foo': 'bar',
		})

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
