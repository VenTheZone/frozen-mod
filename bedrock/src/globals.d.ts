// Bedrock's script runtime provides console but no DOM or Node typings.
declare const console: {
	log(...args: unknown[]): void;
	warn(...args: unknown[]): void;
	error(...args: unknown[]): void;
};
