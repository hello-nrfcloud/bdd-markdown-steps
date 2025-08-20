import assert from 'node:assert/strict'
import { describe, it, mock } from 'node:test'
import { doRequest, type AssertFn } from './doRequest.ts'

void describe('doRequest()', () => {
	void it('should execute a request', async () => {
		const mockFetch = mock.fn(async () =>
			Promise.resolve({
				status: 200,
				headers: new Map<string, string>([
					['content-type', 'application/json'],
					['content-length', '42'],
				]),
				json: async () => Promise.resolve({ foo: 'bar' }),
			}),
		)
		const assertFn = mock.fn<AssertFn>(async () => Promise.resolve())

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
		assert.equal(
			mockArgs[0].toString(),
			new URL('https://example.com').toString(),
		)
		assert.partialDeepStrictEqual(mockArgs[1], { method: 'POST' })
		assert.partialDeepStrictEqual(assertFn.mock.calls[0]?.arguments?.[0], {
			body: { foo: 'bar' },
		})
	})

	void it('should only parse the response if there is content', async () => {
		const mockFetch = mock.fn(async () =>
			Promise.resolve({
				status: 200,
				headers: new Map<string, string>([
					['content-type', 'application/json'],
					['content-length', '0'],
				]),
				json: async () => Promise.resolve(JSON.parse('')), // Intentional empty JSON
			}),
		)
		const assertFn = mock.fn<AssertFn>(async () => Promise.resolve())

		const inFlight = doRequest(
			new URL('https://example.com'),
			{
				method: 'POST',
			},
			undefined,
			mockFetch as any,
		)

		await inFlight.match(assertFn)
		assert.partialDeepStrictEqual(assertFn.mock.calls[0]?.arguments?.[0], {
			body: undefined,
		})
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
						['content-length', '42'],
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

		assert.equal(assertFn.mock.callCount(), 2)
		assert.equal(mockFetch.mock.callCount(), 2)
	})
})
