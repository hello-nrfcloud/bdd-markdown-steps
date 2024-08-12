import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'
import { arrayContaining, check, objectMatching } from 'tsmatchers'
import { doRequest } from './doRequest.js'

void describe('doRequest()', () => {
	void it('should execute a request', async () => {
		const mockFetch = mock.fn(async () =>
			Promise.resolve({
				status: 200,
				headers: new Map<string, string>([
					['content-type', 'application/json'],
				]),
				json: async () => Promise.resolve({ foo: 'bar' }),
			}),
		)
		const assertFn = mock.fn(async () => Promise.resolve())

		const inFlight = doRequest(
			new URL('https://example.com'),
			{
				method: 'POST',
			},
			undefined,
			mockFetch as any,
		)

		await inFlight.match(assertFn)
		const mockArgs: [URL, RequestInit] =
			mockFetch.mock.calls[0]?.arguments ?? ([] as any)
		check(mockArgs[0].toString()).is(new URL('https://example.com').toString())
		check(mockArgs[1]).is(objectMatching({ method: 'POST' }))
		check(assertFn.mock.calls[0]?.arguments ?? []).is(
			arrayContaining(
				objectMatching({
					body: { foo: 'bar' },
				}),
			),
		)
	})

	void it('should retry the request if the assert fails', async () => {
		const mockFetch = mock.fn<() => Promise<ReturnType<typeof fetch>>>()
		mockFetch.mock.mockImplementationOnce(
			async () =>
				Promise.resolve({
					status: 404,
					headers: new Map<string, string>([]),
				} as any),
			0,
		)
		mockFetch.mock.mockImplementationOnce(
			async () =>
				Promise.resolve({
					status: 200,
					headers: new Map<string, string>([
						['content-type', 'application/json'],
					]),
					json: async () => Promise.resolve({ foo: 'bar' }),
				} as any),
			1,
		)
		const assertFn = mock.fn(async ({ response }) =>
			assert.equal(response.status, 200),
		)

		const inFlight = doRequest(
			new URL('https://example.com'),
			{
				method: 'POST',
			},
			undefined,
			mockFetch as any,
		)

		await inFlight.match(assertFn)

		check(assertFn.mock.callCount()).is(2)
		check(mockFetch.mock.callCount()).is(2)
	})
})
