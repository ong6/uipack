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

declare const icons: {
    db: react.JSX.Element;
    cache: react.JSX.Element;
    queue: react.JSX.Element;
    service: react.JSX.Element;
    client: react.JSX.Element;
    blob: react.JSX.Element;
    agent: react.JSX.Element;
    doc: react.JSX.Element;
    model: react.JSX.Element;
    tool: react.JSX.Element;
    gateway: react.JSX.Element;
    lock: react.JSX.Element;
    key: react.JSX.Element;
    clock: react.JSX.Element;
    cron: react.JSX.Element;
    browser: react.JSX.Element;
    terminal: react.JSX.Element;
    git: react.JSX.Element;
    cloud: react.JSX.Element;
    region: react.JSX.Element;
    user: react.JSX.Element;
    robot: react.JSX.Element;
    chart: react.JSX.Element;
    warning: react.JSX.Element;
    more: react.JSX.Element;
};
type IconName = keyof typeof icons;

export { type IconName as I, type LegendItem as L, type TokenKind as T, type TokenShape as a, Legend as b, type LegendProps as c, TOKEN_SHAPE as d, Token as e, type TokenProps as f, icons as i, tokenColor as t };
