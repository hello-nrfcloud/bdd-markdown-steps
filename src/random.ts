import {
	regExpMatchedStep,
	type StepRunner,
} from '@nordicsemiconductor/bdd-markdown'
import { Type } from '@sinclair/typebox'
import { generateCode } from '@hello.nrfcloud.com/proto/fingerprint'

export const email = regExpMatchedStep(
	{
		regExp: /^I have a random email in `(?<storeName>[^`]+)`$/,
		schema: Type.Object({
			storeName: Type.String({ minLength: 1 }),
		}),
	},
	async ({ match: { storeName }, log: { progress }, context }) => {
		const randomEmail = `${generateCode()}@example.com`
		progress(randomEmail)

		context[storeName] = randomEmail
	},
)

export const uuidv4 = regExpMatchedStep(
	{
		regExp: /^I have a random UUIDv4 in `(?<storeName>[^`]+)`$/,
		schema: Type.Object({
			storeName: Type.String({ minLength: 1 }),
		}),
	},
	async ({ match: { storeName }, log: { progress }, context }) => {
		const randomUUIDv4 = crypto.randomUUID()
		progress(randomUUIDv4)

		context[storeName] = randomUUIDv4
	},
)

export const steps: StepRunner<Record<string, any>>[] = [email, uuidv4]
