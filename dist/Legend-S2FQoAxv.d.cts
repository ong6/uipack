import * as react from 'react';
import { CSSProperties } from 'react';

type TokenKind = "request" | "response" | "change" | "accent" | "neutral";
type TokenShape = "square" | "circle" | "diamond";
declare const TOKEN_SHAPE: Record<TokenKind, TokenShape>;
declare function tokenColor(kind: TokenKind): string;
interface TokenProps {
    shape?: TokenShape;
    kind?: TokenKind;
    /** Half the token's width in user units. */
    r?: number;
    cx?: number;
    cy?: number;
    style?: CSSProperties;
}
/** The small shape that rides a connector or sits in a legend. */
declare function Token({ shape, kind, r, cx, cy, style }: TokenProps): react.JSX.Element;

interface LegendItem {
    label: string;
    kind?: TokenKind;
    shape?: TokenShape;
}
interface LegendProps {
    items: LegendItem[];
}
/** Shape-coded key rendered in the Figure header. Hovering an item highlights every element of that kind. */
declare function Legend({ items }: LegendProps): react.JSX.Element | null;

export { Legend as L, type TokenKind as T, type TokenShape as a, type LegendItem as b, type LegendProps as c, TOKEN_SHAPE as d, Token as e, type TokenProps as f, tokenColor as t };
