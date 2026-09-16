// 16×16 line glyphs. Stroke and fill come from the parent <g>.
export const icons = {
  db: (
    <>
      <ellipse cx="8" cy="3.5" rx="6" ry="2.5" />
      <path d="M2 3.5v9c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-9" />
      <path d="M2 8c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5" />
    </>
  ),
  cache: (
    <>
      <path d="M9 1.5 3.5 9H8l-1 5.5L12.5 7H8z" />
    </>
  ),
  queue: (
    <>
      <rect x="1.5" y="4" width="13" height="8" rx="1.5" />
      <path d="M5 4v8M9 4v8" />
    </>
  ),
  service: (
    <>
      <rect x="2" y="2" width="12" height="12" rx="2" />
      <path d="M5 8h6M8 5v6" />
    </>
  ),
  client: (
    <>
      <rect x="1.5" y="3" width="13" height="8" rx="1.5" />
      <path d="M5.5 14h5M8 11v3" />
    </>
  ),
  blob: (
    <>
      <path d="M8 1.5 14 5v6l-6 3.5L2 11V5z" />
      <path d="M8 8l6-3M8 8 2 5M8 8v6.5" />
    </>
  ),
  agent: (
    <>
      <circle cx="8" cy="5" r="3" />
      <path d="M2.5 14.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M8 1v1" />
    </>
  ),
  doc: (
    <>
      <path d="M4 1.5h5.5L13 5v9.5H4z" />
      <path d="M9.5 1.5V5H13M6 8h4M6 11h4" />
    </>
  ),
  model: (
    <>
      <rect x="2" y="4" width="12" height="8" rx="2" />
      <circle cx="5.5" cy="8" r="1" fill="currentColor" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <circle cx="10.5" cy="8" r="1" fill="currentColor" />
      <path d="M8 1.5V4M8 12v2.5" />
    </>
  ),
  tool: (
    <>
      <path d="M10.5 2a3.5 3.5 0 0 0-3.3 4.7L2 11.9l2.1 2.1 5.2-5.2A3.5 3.5 0 0 0 14 5.5L11.8 7.7 9.3 6.2l-1-2.4z" />
    </>
  ),
  gateway: (
    <>
      <path d="M2 8h12M2 8l3-3M2 8l3 3M14 8l-3-3M14 8l-3 3" />
      <rect x="6" y="5.5" width="4" height="5" rx="1" fill="var(--uipack-surface, #fff)" />
    </>
  ),
  lock: (
    <>
      <rect x="3" y="7" width="10" height="7.5" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
      <circle cx="8" cy="10.75" r="1" fill="currentColor" />
    </>
  ),
  key: (
    <>
      <circle cx="5.5" cy="8" r="3" />
      <path d="M8.5 8H14M12 8v2.5M10 8v2" />
    </>
  ),
  clock: (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.5V8l2.5 1.5" />
    </>
  ),
  cron: (
    <>
      <circle cx="8" cy="8.5" r="5" />
      <path d="M8 5.5v3l2 1M5 2l-2.5 2M11 2l2.5 2" />
    </>
  ),
  browser: (
    <>
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
      <path d="M1.5 6h13M4 4.25h.01M6 4.25h.01" />
    </>
  ),
  terminal: (
    <>
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
      <path d="M4.5 6l2.5 2-2.5 2M8.5 10.5h3" />
    </>
  ),
  git: (
    <>
      <circle cx="4.5" cy="3.5" r="1.75" />
      <circle cx="4.5" cy="12.5" r="1.75" />
      <circle cx="11.5" cy="5.5" r="1.75" />
      <path d="M4.5 5.25v5.5M11.5 7.25c0 2.5-2 3-4 3.25a3 3 0 0 0-3 .5" />
    </>
  ),
  cloud: (
    <>
      <path d="M4.5 13a3 3 0 0 1-.4-6A4 4 0 0 1 12 6.5a3.25 3.25 0 0 1 0 6.5z" />
    </>
  ),
  region: (
    <>
      <path d="M8 14.5s4.5-4.2 4.5-8A4.5 4.5 0 0 0 3.5 6.5c0 3.8 4.5 8 4.5 8z" />
      <circle cx="8" cy="6.5" r="1.5" />
    </>
  ),
  user: (
    <>
      <circle cx="8" cy="5.5" r="3" />
      <path d="M2.5 14.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    </>
  ),
  robot: (
    <>
      <rect x="3" y="5" width="10" height="8" rx="2" />
      <path d="M8 2v3M6 13v1.5M10 13v1.5M1.5 8.5v2M14.5 8.5v2" />
      <circle cx="6" cy="8.5" r="1" fill="currentColor" />
      <circle cx="10" cy="8.5" r="1" fill="currentColor" />
    </>
  ),
  chart: (
    <>
      <path d="M2 14h12M4 11V7M8 11V4M12 11V8.5" />
    </>
  ),
  warning: (
    <>
      <path d="M8 2 14.5 13.5h-13z" />
      <path d="M8 6.5v3.5M8 12.25h.01" />
    </>
  ),
  more: (
    <>
      <circle cx="3" cy="8" r="1" fill="currentColor" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <circle cx="13" cy="8" r="1" fill="currentColor" />
    </>
  ),
};

export type IconName = keyof typeof icons;
