import type { LogObserver } from '@nordicsemiconductor/bdd-markdown'

const print = (arg: unknown) =>
	typeof arg === 'object' ? JSON.stringify(arg) : arg

export const logObserver: LogObserver = {
	onDebug: (info, ...args) =>
		console.error(
			info.step.keyword,
			info.step.title,
			...args.map((arg) => print(arg)),
		),
	onError: (info, ...args) =>
		console.error(
			info.step.keyword,
			info.step.title,
			...args.map((arg) => print(arg)),
		),
	onInfo: (info, ...args) =>
		console.error(
			info.step.keyword,
			info.step.title,
			...args.map((arg) => print(arg)),
		),
	onProgress: (info, ...args) =>
		console.error(
			info.step.keyword,
			info.step.title,
			...args.map((arg) => print(arg)),
		),
}
