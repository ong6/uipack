import type { ReactNode } from "react";
import { Chip, FileMark, Figure, FolderMark, Sheet, TreeRail, useFontFloor } from "../../src";

// File tree: what is stored where, and what one file holds. Adapted from the
// packfile figure in OpenAI's "Scaling Git at OpenAI" (2026-11), made ours: a
// folder rail with Bus-style junction dots, Sheets in the Node box language
// with the file name as a tracked mono eyebrow, the archive (the subject) in
// the accent, tag Chips for the sections each copy carries and a dashed slot
// for content reused rather than stored. Neutral content: two backups of one
// report, loose or archived.

function Txt({
  x,
  y,
  size,
  children,
  mono,
  muted,
  anchor = "start",
}: {
  x: number;
  y: number;
  size: number;
  children: ReactNode;
  mono?: boolean;
  muted?: boolean;
  anchor?: "start" | "middle" | "end";
}) {
  const fs = useFontFloor(size);
  return (
    <text
      x={x}
      y={y + fs * 0.36}
      fontSize={fs}
      textAnchor={anchor}
      fontFamily={mono ? "var(--uipack-mono)" : undefined}
      letterSpacing={mono ? ".06em" : undefined}
      fontWeight={mono ? 500 : 400}
      fill="currentColor"
      fillOpacity={muted ? 0.72 : 1}
    >
      {mono ? String(children).toUpperCase() : children}
    </text>
  );
}

const DASH = { fill: "none", stroke: "currentColor", strokeOpacity: 0.7, strokeWidth: 1.25, strokeDasharray: "3 3" } as const;

function Wide() {
  const R = 1072; // right edge of every sheet
  return (
    <>
      <FolderMark x={37} y={48} />
      <Txt x={68} y={48} size={14} mono>
        backups/
      </Txt>
      <Txt x={300} y={48} size={14} muted>
        Two copies of report.md, loose or archived
      </Txt>
      <TreeRail x={48} y={64} rows={[128, 224, 304]} to={160} />

      <Sheet x={160} y={88} w={R - 160} h={80} name="03/14…" title="Loose copy A" />
      <Chip x={R - 196} y={112} w={164} h={32} label="intro" kind="accent" soft shape="tag" size={13} />

      <Sheet x={160} y={184} w={R - 160} h={80} name="03/15…" title="Loose copy B" />
      <Chip x={R - 376} y={208} w={164} h={32} label="intro" kind="accent" soft shape="tag" size={13} />
      <Chip x={R - 196} y={208} w={164} h={32} label="summary" kind="accent" shape="tag" size={13} />

      <FolderMark x={158} y={304} size={20} />
      <Txt x={192} y={304} size={14} mono>
        archive/
      </Txt>
      <TreeRail x={168} y={318} rows={[456, 584]} to={224} />

      <Sheet x={224} y={344} w={R - 224} h={204} name="arch-7f3a….zip" title="Archive with 2 copies" accent>
        <Txt x={244} y={456} size={16}>
          Copy A
        </Txt>
        <Txt x={392} y={456} size={14} muted>
          full copy
        </Txt>
        <Chip x={560} y={440} w={168} h={32} label="intro" kind="accent" soft shape="tag" size={13} />
        <Txt x={244} y={516} size={16}>
          Copy B
        </Txt>
        <Txt x={392} y={516} size={14} muted>
          changes only
        </Txt>
        <rect x={560} y={500} width={168} height={32} rx={4} {...DASH} />
        <Txt x={644} y={516} size={13} anchor="middle">
          reuse all of A
        </Txt>
        <path
          d="M644,496 V478 M639,483 L644,477 L649,483"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.25}
          strokeLinecap="round"
        />
        <Txt x={756} y={516} size={16} anchor="middle">
          +
        </Txt>
        <Chip x={784} y={500} w={168} h={32} label="summary" kind="accent" shape="tag" size={13} />
      </Sheet>

      <FileMark x={224} y={584} />
      <Txt x={256} y={584} size={14} mono>
        arch-7f3a….idx
      </Txt>
      <Txt x={560} y={584} size={14} muted>
        Index · finds both copies in the archive
      </Txt>
    </>
  );
}

// Narrow: the same tree, the tags moved under each title so nothing is squeezed.
function Narrow() {
  const R = 344;
  return (
    <>
      <FolderMark x={12} y={32} size={20} />
      <Txt x={42} y={32} size={14} mono>
        backups/
      </Txt>
      <TreeRail x={22} y={46} rows={[120, 248, 336]} to={48} />

      <Sheet x={48} y={64} w={R - 48} h={112} name="03/14…" title="Loose copy A" head={64} titleX={16} size={14}>
        <Chip x={64} y={138} w={104} h={28} label="intro" kind="accent" soft shape="tag" size={12} />
      </Sheet>
      <Sheet x={48} y={192} w={R - 48} h={112} name="03/15…" title="Loose copy B" head={64} titleX={16} size={14}>
        <Chip x={64} y={266} w={104} h={28} label="intro" kind="accent" soft shape="tag" size={12} />
        <Chip x={176} y={266} w={120} h={28} label="summary" kind="accent" shape="tag" size={12} />
      </Sheet>

      <FolderMark x={48} y={336} size={18} />
      <Txt x={76} y={336} size={14} mono>
        archive/
      </Txt>
      <TreeRail x={57} y={348} rows={[456, 612]} to={80} />

      <Sheet
        x={80}
        y={368}
        w={R - 80}
        h={216}
        name="arch-7f3a….zip"
        title="Archive, 2 copies"
        head={64}
        titleX={16}
        size={14}
        accent
      >
        <Txt x={96} y={456} size={14}>
          Copy A · full
        </Txt>
        <Chip x={96} y={470} w={104} h={28} label="intro" kind="accent" soft shape="tag" size={12} />
        <Txt x={96} y={522} size={14}>
          Copy B · changes only
        </Txt>
        <rect x={96} y={538} width={104} height={28} rx={4} {...DASH} />
        <Txt x={148} y={552} size={12} anchor="middle">
          reuse A
        </Txt>
        <Txt x={212} y={552} size={14} anchor="middle">
          +
        </Txt>
        <Chip x={224} y={538} w={104} h={28} label="summary" kind="accent" shape="tag" size={12} />
      </Sheet>

      <FileMark x={80} y={612} size={14} />
      <Txt x={104} y={612} size={13} mono>
        arch-7f3a….idx
      </Txt>
      <Txt x={104} y={636} size={13} muted>
        Index · finds both copies
      </Txt>
    </>
  );
}

export function FileTreeFigure({ number }: { number: string }) {
  return (
    <Figure
      number={number}
      eyebrow="File tree"
      title="An archive stores the second copy as changes"
      caption="Each loose copy holds every section in full. Inside the archive, copy B keeps only its new summary and points back to copy A for the rest; the index finds both. Pale tags are sections already stored, full tags are new."
      controls={false}
      viewBox="0 0 1104 616"
      narrow={<Narrow />}
      narrowViewBox="0 0 360 660"
      alt="A file tree. The backups folder holds two loose copies of a report: copy A with an intro section, copy B with the intro and a new summary. An archive folder holds one archive file with both copies: copy A in full, copy B as changes only, reusing all of copy A plus the new summary. Beside it, an index file finds both copies in the archive."
    >
      <Wide />
    </Figure>
  );
}
