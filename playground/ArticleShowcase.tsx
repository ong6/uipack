import type { ReactNode } from "react";
import { Callout, ChangeNote, LayerHead, LinkList, NoteCard, NoteCluster, TermList } from "../src/article";
import "../src/article/article.css";
import { LayerSection, harness, inference, notes, plannedNote } from "../examples/articleParts";
import { articleEntries } from "./catalog";
import { ShowcaseShell, useShowcaseTheme } from "./ShowcaseShell";
import "./article-showcase.css";

/* uipack/article in a host article: a 40rem prose column with blog-like
   prose CSS, a 56rem slot for wide clusters, and ?host=notes to map the
   --uipack-* tokens to the notes site's warm palette (as its .fig-html does). */

const HOSTS = [
  { id: "uipack", label: "uipack defaults" },
  { id: "notes", label: "notes site palette" },
] as const;
type Host = (typeof HOSTS)[number]["id"];

function useHost(): Host {
  return new URLSearchParams(location.search).get("host") === "notes" ? "notes" : "uipack";
}

function hostHref(host: Host) {
  const url = new URL(location.href);
  if (host === "uipack") url.searchParams.delete("host");
  else url.searchParams.set("host", host);
  url.hash = "";
  return `${url.pathname}${url.search}`;
}

const entry = (id: string) => articleEntries.find((e) => e.id === id)!;

function Entry({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section data-catalog-entry={id} id={id}>
      <h2>{entry(id).title}</h2>
      <div className="article-host__prose">{children}</div>
    </section>
  );
}

export default function ArticleShowcase() {
  const { theme, flip } = useShowcaseTheme();
  const host = useHost();
  return (
    <ShowcaseShell active="article" theme={theme} flip={flip}>
      <p className="article-bar">
        Host
        {HOSTS.map((h) => (
          <a key={h.id} href={hostHref(h.id)} aria-current={h.id === host ? "true" : undefined}>
            {h.label}
          </a>
        ))}
      </p>
      <div className="article-host" data-host={host}>
        <section data-catalog-entry="layer-section" id="layer-section">
          <h2>{entry("layer-section").title}</h2>
          <article className="article-host__prose">
            <p>
              Two layer sections of an article, composed from the parts: a strip above each heading, the prose, then the labelled blocks. The
              first cluster stays in the 40rem text column; the second breaks out to the 56rem figure slot.
            </p>
            <LayerSection section={inference} id="inference" mapHref="#layer-section" />
            <LayerSection section={harness} id="harness" mapHref="#layer-section" wide />
          </article>
        </section>

        <Entry id="note-card">
          <p>A published note is one link; a planned note is a dashed box with no link.</p>
          <NoteCard {...notes.prefillVsDecode} />
          <NoteCard {...plannedNote} />
        </Entry>

        <Entry id="note-cluster">
          <p>At the text column: two columns from 560px.</p>
          <NoteCluster label="My notes on agents and harnesses" note="Each one works through a number from the harness section." notes={[notes.contextEngineering, notes.agentIntegrations, notes.opusOrchestrating, plannedNote]} />
          <p>With wide, in the 56rem figure slot: three columns from 860px.</p>
          <NoteCluster label="My notes on serving and product" notes={[notes.prefillVsDecode, notes.quantization, notes.promptCaching]} wide />
        </Entry>

        <Entry id="layer-head">
          <LayerHead index={8} zone="Serving and product" metric={{ value: "~10 GB", label: "KV cache, one 32k chat" }} mapHref="#layer-section" />
          <h3>Inference</h3>
          <p>Index, zone, metric and the map link.</p>
          <LayerHead index={7} zone="Models" mapHref="#layer-section" />
          <h3>Post-training</h3>
          <p>No metric.</p>
          <LayerHead index={1} zone="Infrastructure" metric={{ value: "1 GW+", label: "per frontier campus" }} />
          <h3>Power and sites</h3>
          <p>No map link.</p>
        </Entry>

        <Entry id="term-list">
          <TermList terms={inference.terms} />
        </Entry>

        <Entry id="callout">
          <Callout kind="selftest">{inference.selftest}</Callout>
          <Callout kind="note">
            Evals and gateways run beside the layers they serve, so they get their own sections rather than a number in the stack.
          </Callout>
        </Entry>

        <Entry id="change-note">
          <ChangeNote kicker="2025–26">{inference.changed}</ChangeNote>
        </Entry>

        <Entry id="link-list">
          <LinkList links={inference.links} />
          <LinkList label="Go deeper (inline fallback)">
            Hamel Husain and Shreya Shankar's <a href="https://hamel.dev/blog/posts/evals-faq/">evals FAQ</a>; METR's{" "}
            <a href="https://arxiv.org/abs/2503.14499">long-tasks paper</a>.
          </LinkList>
        </Entry>
      </div>
    </ShowcaseShell>
  );
}
