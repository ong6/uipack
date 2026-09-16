import * as react from 'react';

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

export { type IconName as I, icons as i };
