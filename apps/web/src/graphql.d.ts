/*
 * `?raw` on a `.graphql` file.
 *
 * Vite's own types cover `?raw` for the extensions it knows about, and
 * `.graphql` is not one of them - it has no loader here, only the raw import.
 * Declaring it is what lets the schema be inlined without an `any` in the one
 * file that defines the contract.
 */
declare module "*.graphql?raw" {
	const content: string;
	export default content;
}
