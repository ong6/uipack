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
  more: (
    <>
      <circle cx="3" cy="8" r="1" fill="currentColor" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <circle cx="13" cy="8" r="1" fill="currentColor" />
    </>
  ),
};

export type IconName = keyof typeof icons;
