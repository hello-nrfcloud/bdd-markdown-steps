import {
	regExpMatchedStep,
	type StepRunner,
} from '@nordicsemiconductor/bdd-markdown'
import { Type } from '@sinclair/typebox'
import { generateCode } from '@hello.nrfcloud.com/proto/fingerprint'

const random = (
	id: string,
	generator: () => string,
): StepRunner<Record<string, any>> =>
	regExpMatchedStep(
		{
			regExp: new RegExp(`^I have a random ${id} in \`(?<storeName>[^\`]+)\`$`),
			schema: Type.Object({
				storeName: Type.String({ minLength: 1 }),
			}),
		},
		async ({ match: { storeName }, log: { progress }, context }) => {
			const randomString = generator()
			progress(randomString)

			context[storeName] = randomString
		},
	)

export const UUIDv4 = (): string => crypto.randomUUID()
export const email = (): string => `${generateCode()}@example.com`
export const IMEI = (): string =>
	(350006660000000 + Math.floor(Math.random() * 10000000)).toString()

export const steps: (
	generators?: Record<string, () => string>,
) => StepRunner<Record<string, any>>[] = (
	generators = {
		email,
		UUIDv4,
		IMEI,
	},
) => Object.entries(generators).map(([id, generator]) => random(id, generator))
