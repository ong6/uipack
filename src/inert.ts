import { version } from "react";

/**
 * The `inert` prop that makes an element inert on the React it runs on. React 19 knows `inert` as a
 * boolean attribute and reads an empty string as false; React 18 does not know it, drops `true` and
 * passes a string through. Either way the element gets `inert=""`, on the server and the client.
 */
const ON = Number(version.split(".")[0]) >= 19 ? true : "";

/** Spread onto an element: `{...inertProps(hidden)}`. Typed `object`: React 18's types have no `inert`. */
export const inertProps = (on: boolean): object => (on ? { inert: ON } : {});
