import {
  BarChart,
  ConsultingSlide,
  HarveyTable,
  KpiTiles,
  LineChart,
  Matrix2x2,
  Morph,
  Panel,
  Ref,
  SoWhat,
  StackedBar,
  Waterfall,
  formatValue,
  formatter,
  type DeckSlide,
  type LintOptions,
} from "../src/deck";
import "../src/deck/consulting/consulting.css";

/* A decision-request deck in the consulting style. Every number is illustrative: a generic
   distributor with five fulfilment sites, invented for the example. */

const sections = ["Summary", "Situation", "Diagnosis", "Options", "Recommendation", "Plan", "Decision"] as const;
const tracker = (current: (typeof sections)[number]) => ({ sections, current });
const label = "Fulfilment network review";
const sticker = "Illustrative";
const source = "Illustrative fulfilment cost model and example management accounts, FY22–FY25. Not a real company.";

const dollars = formatter({ prefix: "$", decimals: 2 });
const millions = formatter({ prefix: "$", suffix: "M" });
const oneDp = formatter({ decimals: 1 });

const sites = [
  { label: "Northgate", value: 10.9, highlight: true },
  { label: "Riverside", value: 10.1, highlight: true },
  { label: "Eastfield", value: 7.6 },
  { label: "Harbour", value: 7.2 },
  { label: "Westpark", value: 6.8 },
];

export const consultingDeckLint: LintOptions = { template: "decision-request" };

export const consultingDeck: DeckSlide[] = [
  {
    id: "summary",
    title: "Two hubs save $14M a year",
    headline: "Consolidating five fulfilment sites into two hubs saves $14M a year for $9M",
    role: "answer",
    render: () => (
      <ConsultingSlide
        tracker={tracker("Summary")}
        sticker={sticker}
        label={label}
        title="Consolidating five fulfilment sites into two hubs saves $14M a year for $9M"
        subtitle="Fulfilment network, FY22–FY25 actuals and FY27 run-rate; $M unless stated"
        rows="auto minmax(0, 1fr)"
        notes={["Operating margin before central costs.", "Run-rate saving from FY27, before the one-off cost of $9M."]}
        source={source}
      >
        <Panel title="FY25 against FY22" cols={12}>
          <KpiTiles
            items={[
              {
                label: "Cost per order",
                value: "$8.40",
                morphId: "cost-per-order",
                highlight: true,
                delta: { text: "+22%", direction: "up", sentiment: "bad", period: "vs FY22" },
                trend: [6.9, 7.0, 7.2, 7.5, 7.8, 8.0, 8.2, 8.4],
              },
              {
                label: "Operating margin",
                value: "4.2%",
                delta: { text: "−3.1 pts", direction: "down", sentiment: "bad", period: "vs FY22" },
                trend: [7.3, 7.0, 6.5, 6.0, 5.4, 5.0, 4.6, 4.2],
              },
              {
                label: "On-time delivery",
                value: "91%",
                delta: { text: "−4 pts", direction: "down", sentiment: "bad", period: "vs FY22" },
                trend: [95, 95, 94, 93, 93, 92, 91, 91],
              },
              {
                label: "Orders shipped",
                value: "12.6",
                unit: "M",
                delta: { text: "+38%", direction: "up", sentiment: "good", period: "vs FY22" },
                trend: [9.1, 9.6, 10.2, 10.8, 11.4, 11.9, 12.3, 12.6],
              },
            ]}
          />
        </Panel>
        <Panel
          title="Freight and labour took 2.8 of the 3.1 points"
          unit={<>Operating margin<Ref n={1} />, % of revenue, FY22 → FY25</>}
          cols={5}
        >
          <Waterfall
            format={oneDp}
            domain={[0, 7.5]}
            steps={[
              { label: "FY22", value: 7.3, total: true },
              { label: "Freight", value: -1.6 },
              { label: "Labour", value: -1.2 },
              { label: "Rent", value: -0.6 },
              { label: "Mix", value: 0.3 },
              { label: "FY25", total: true },
            ]}
            callout={{ label: "Freight", text: "Split shipments from five sites", dx: -20, dy: 90, width: 220 }}
          />
        </Panel>
        <Panel title="Two hubs save the most of four options" unit="Run-rate saving, $M a year, FY27" cols={4}>
          <BarChart
            format={millions}
            data={[
              { label: "Two hubs", value: 14, highlight: true },
              { label: "Outsource (3PL)", value: 11 },
              { label: "Renegotiate freight", value: 4 },
              { label: "Do nothing", value: 0 },
            ]}
          />
        </Panel>
        <SoWhat cols={3}>
          <p>Freight and labour costs grow with every extra site.</p>
          <p>
            Closing the two oldest sites removes both: <strong>$14M a year</strong>
            <Ref n={2} /> for a one-off $9M, paid back in 14 months.
          </p>
          <p>
            <strong>Decision needed by 14 March.</strong>
          </p>
        </SoWhat>
      </ConsultingSlide>
    ),
    notes: {
      say: "Here is the whole answer on one page. Cost per order is up twenty-two percent in three years and margin has lost three points, mostly to freight and labour. Of the four options we looked at, consolidating five sites into two hubs saves the most: fourteen million a year for a one-off nine million. We need a decision by the fourteenth of March. Source: the illustrative cost model in the appendix.",
      delivery: "Say the ask in the first thirty seconds, then point at the margin bridge.",
      next: "Start with the number on the left: cost per order.",
    },
  },
  {
    id: "situation",
    title: "Cost per order reached $8.40",
    headline: "Cost per order rose to $8.40 as orders spread across five sites",
    role: "context",
    transition: "morph",
    render: () => (
      <ConsultingSlide
        tracker={tracker("Situation")}
        sticker={sticker}
        label={label}
        title={["Cost per order rose to ", <Morph key="n" id="cost-per-order" as="span">$8.40</Morph>, " as orders spread across five sites"]}
        subtitle="Fulfilment network, FY22–FY25"
        takeaway="The network grew in sites, not in scale: each new site added split shipments and part-empty shifts."
        notes={["Index of annual totals; FY22 = 100.", "Dashed line: network average, weighted by orders shipped."]}
        source={source}
      >
        <Panel title="Fulfilment cost outgrew orders from FY23" unit={<>Index, FY22 = 100<Ref n={1} /></>} cols={4}>
          <LineChart
            x={["FY22", "FY23", "FY24", "FY25"]}
            format={formatter()}
            series={[
              { name: "Cost", values: [100, 116, 145, 168], highlight: true },
              { name: "Orders", values: [100, 112, 127, 138] },
              { name: "Revenue", values: [100, 109, 121, 131] },
            ]}
            annotate={{ series: "Cost", index: 2, text: "Fifth site opens", dx: -150, dy: -96, width: 130 }}
          />
        </Panel>
        <Panel title="Freight and labour drove the rise" unit="Cost per order by component, $" cols={4}>
          <StackedBar
            format={dollars}
            segmentFormat={oneDp}
            series={["Freight", "Labour", "Rent", "Other"]}
            categories={[
              { label: "FY22", values: [2.6, 2.4, 1.0, 0.9] },
              { label: "FY23", values: [2.8, 2.5, 1.0, 0.9] },
              { label: "FY24", values: [3.1, 2.7, 1.2, 0.8] },
              { label: "FY25", values: [3.4, 2.9, 1.3, 0.8], highlight: true },
            ]}
          />
        </Panel>
        <Panel
          title="Two older sites cost most"
          unit={<>$ per order, FY25<Ref n={2} /></>}
          cols={4}
          morphId="site-costs"
          callout="33% of orders"
        >
          <BarChart format={dollars} data={sites} domain={[0, 12]} reference={{ value: 8.4, label: "Network $8.40" }} />
        </Panel>
      </ConsultingSlide>
    ),
    notes: {
      say: "This is the situation everyone in the room already knows. Orders grew thirty-eight percent, but fulfilment cost grew sixty-eight, and the gap opened when the fifth site came on line. Freight and labour per order account for most of the rise. And the cost is not spread evenly: two sites sit well above the network average. Source: management accounts, FY22 to FY25.",
      delivery: "Let the number settle into the title before you talk.",
      next: "Let's look inside the site panel.",
    },
  },
  {
    id: "sites",
    title: "Two sites cost 46% more",
    headline: "Northgate and Riverside cost 46% more per order than the other three sites",
    role: "evidence",
    transition: { zoom: "site-costs" },
    render: () => (
      <ConsultingSlide
        tracker={tracker("Diagnosis")}
        sticker={sticker}
        label={label}
        title="Northgate and Riverside cost 46% more per order than the other three sites"
        subtitle="Five fulfilment sites, FY25"
        takeaway="Moving their 4.1M orders to two modern hubs at about $7.10 an order is worth roughly $14M a year."
        notes={["Utilisation: picked hours over staffed hours.", "Split shipment: one order sent in two or more parcels."]}
        source={source}
      >
        <Panel
          title="The two oldest sites sit in the consolidate corner"
          unit={<>Utilisation<Ref n={1} /> against cost per order; bubble area = orders shipped, FY25</>}
          cols={7}
        >
          <Matrix2x2
            x={{ label: "Utilisation, %", domain: [40, 100], split: 75, format: formatter({ suffix: "%" }) }}
            y={{ label: "Cost per order, $", domain: [5.5, 12], split: 8.4, format: dollars }}
            quadrants={["Consolidate", "Fix the cost base", "Fill capacity", "Keep and grow"]}
            focus="tl"
            maxRadius={40}
            points={[
              { label: "Northgate", x: 56, y: 10.9, size: 1.9, highlight: true, labelAt: "left" },
              { label: "Riverside", x: 62, y: 10.1, size: 2.2, highlight: true },
              { label: "Eastfield", x: 70, y: 7.4, size: 2.8, labelAt: "left" },
              { label: "Harbour", x: 82, y: 7.9, size: 3.1, labelAt: "top" },
              { label: "Westpark", x: 94, y: 6.9, size: 2.6, labelAt: "left" },
            ]}
            callout={{ label: "Northgate", text: "Manual picking; 56% of shifts used", dx: 120, dy: -58, width: 240 }}
          />
        </Panel>
        <Panel
          title="Their orders split into two parcels twice as often"
          unit={<>Share of orders by shipment type<Ref n={2} />, %, FY25</>}
          cols={5}
        >
          <StackedBar
            orientation="horizontal"
            mode="percent"
            series={["One parcel", "Split shipment"]}
            categories={[
              { label: "Northgate", values: [62, 38], highlight: true },
              { label: "Riverside", values: [66, 34], highlight: true },
              { label: "Eastfield", values: [82, 18] },
              { label: "Harbour", values: [85, 15] },
              { label: "Westpark", values: [88, 12] },
            ]}
          />
        </Panel>
      </ConsultingSlide>
    ),
    notes: {
      say: "Inside that panel: Northgate and Riverside cost forty-six percent more per order than the other three, and they run at well under two-thirds utilisation. Their orders also split into two parcels about twice as often, which is where the freight goes. Source: site cost data and the shipment log, FY25.",
      delivery: "Point at the top-left quadrant, then at the two long split-shipment bars.",
      next: "So what could we do about it?",
    },
  },
  {
    id: "options",
    title: "Four options compared",
    headline: "Of four options, only consolidating to two hubs saves over $10M at acceptable risk",
    role: "option",
    render: () => (
      <ConsultingSlide
        tracker={tracker("Options")}
        sticker={sticker}
        label={label}
        title="Of four options, only consolidating to two hubs saves over $10M at acceptable risk"
        subtitle="Fulfilment network options, FY27 run-rate; $M"
        takeaway="Two hubs is the only option that restores FY22 margin; its cost is a nine-month transition that is hard to reverse."
        notes={["Run-rate from FY27; $M.", "Full ball = most favourable: highest margin, lowest service risk, fastest, easiest to undo."]}
        source={source}
      >
        <Panel title="Four options on six criteria" unit={<>Harvey balls scored by the working team<Ref n={2} /></>} cols={12}>
          <HarveyTable
            corner="Option"
            columns={[
              { key: "saving", label: <>Saving a year<Ref n={1} /></>, kind: "text", width: "15%" },
              { key: "cost", label: "One-off cost", kind: "text", width: "13%" },
              { key: "margin", label: "Margin", width: "10%" },
              { key: "service", label: "Service", width: "10%" },
              { key: "speed", label: "Speed", width: "10%" },
              { key: "undo", label: "Reversible", width: "11%" },
            ]}
            rows={[
              {
                label: "Do nothing",
                detail: "Margin keeps falling about a point a year",
                cells: { saving: "$0", cost: "$0", margin: 0, service: 1, speed: 0, undo: 4 },
              },
              {
                label: "Renegotiate freight",
                detail: "Carriers are already close to market rates",
                cells: { saving: "$4M", cost: "$0.5M", margin: 1, service: 4, speed: 4, undo: 4 },
              },
              {
                label: "Consolidate to two hubs",
                detail: "Close Northgate and Riverside; expand two sites",
                highlight: true,
                cells: { saving: "$14M", cost: "$9M", margin: 4, service: 2, speed: 2, undo: 1 },
              },
              {
                label: "Outsource to a 3PL",
                detail: "A logistics provider runs all five sites",
                cells: { saving: "$11M", cost: "$3M", margin: 3, service: 1, speed: 3, undo: 1 },
              },
            ]}
          />
        </Panel>
      </ConsultingSlide>
    ),
    notes: {
      say: "We compared four options on the same six criteria, including doing nothing. Renegotiating freight is quick and safe but worth only four million, because our carriers are already near market rates. Outsourcing saves eleven but hands peak capacity to someone else. Two hubs saves fourteen million; what it costs is a nine-month transition that is hard to undo. Source: the working team's estimates.",
      delivery: "Read the recommended row last, and say its weak scores out loud.",
      next: "Here is why the hubs still win.",
    },
  },
  {
    id: "recommendation",
    title: "Two hubs win",
    headline: "Two hubs win on savings; the price is nine months of dual running",
    role: "recommendation",
    render: () => (
      <ConsultingSlide
        tracker={tracker("Recommendation")}
        sticker={sticker}
        label={label}
        title="Two hubs win on savings; the price is nine months of dual running"
        subtitle="Fulfilment cost, FY25 actual to FY27 run-rate"
        takeaway="Accept a two-point dip in on-time delivery for two quarters to take $14M a year out of the cost base."
        notes={["Axis starts at $80M, so the totals are truncated.", "During cutover, both closing sites and both hubs are staffed."]}
        source={source}
      >
        <Panel title="$14M comes out of the cost base by FY27" unit={<>Fulfilment cost, $M a year<Ref n={1} /></>} cols={7}>
          <Waterfall
            format={oneDp}
            goodDirection="down"
            domain={[80, 110]}
            steps={[
              { label: "FY25 cost", value: 106, total: true },
              { label: "Freight", value: -6.1 },
              { label: "Labour", value: -4.2 },
              { label: "Rent", value: -2.6 },
              { label: "Inventory", value: -1.1 },
              { label: "FY27 cost", total: true },
            ]}
          />
        </Panel>
        <Panel title="What it costs and what it returns" unit={<>Two-hub option; cutover in months 6–9<Ref n={2} /></>} cols={5}>
          <KpiTiles
            columns={2}
            items={[
              { label: "One-off cost", value: "$9M", note: "Hub fit-out and site exits" },
              { label: "Payback", value: "14", unit: "months", note: "Counted from approval" },
              {
                label: "Cost per order, FY27",
                value: "$7.30",
                highlight: true,
                delta: { text: "−13%", direction: "down", sentiment: "good", period: "vs FY25" },
              },
              {
                label: "On-time during cutover",
                value: "89%",
                delta: { text: "−2 pts", direction: "down", sentiment: "bad", period: "two quarters" },
              },
            ]}
          />
        </Panel>
      </ConsultingSlide>
    ),
    notes: {
      say: "The recommendation is two hubs. Freight falls most, because orders stop splitting across sites, then labour and rent. The price is real: nine months of running both networks, and on-time delivery dips about two points for two quarters. We think that is worth fourteen million a year.",
      delivery: "Name the cost before anyone asks about it.",
      next: "This is how we would do it.",
    },
  },
  {
    id: "plan",
    title: "Nine months and $9M",
    headline: "Nine months and $9M; done when cost per order falls below $7.30",
    role: "plan",
    render: () => (
      <ConsultingSlide
        tracker={tracker("Plan")}
        sticker={sticker}
        label={label}
        title="Nine months and $9M; done when cost per order falls below $7.30"
        subtitle="Two-hub option; months from approval"
        rows="minmax(0, 1fr) auto"
        notes={["Savings less one-off and dual-running costs, against FY25 cost.", "Margin erosion continues at the FY23–FY25 rate."]}
        source={source}
      >
        <Panel
          title="Cash turns positive in month 14"
          unit={<>Cumulative net cash<Ref n={1} />, $M; do nothing<Ref n={2} /> for comparison</>}
          cols={7}
          rows={2}
        >
          <LineChart
            x={["M0", "M3", "M6", "M9", "M12", "M15", "M18", "M21", "M24"]}
            format={formatter({ decimals: 1, sign: true })}
            tickFormat={formatter()}
            domain={[-12, 12]}
            reference={{ value: 0, label: "Break-even" }}
            series={[
              { name: "Two hubs", values: [0, -3.0, -6.5, -8.0, -2.6, 0.9, 4.4, 7.9, 11.4], highlight: true },
              { name: "Do nothing", values: [0, -0.8, -1.6, -2.5, -3.4, -4.3, -5.3, -6.3, -7.3] },
            ]}
            annotate={{ series: "Two hubs", index: 3, text: "Peak outlay $8M while both networks run", dx: 90, dy: 12, width: 250 }}
          />
        </Panel>
        <Panel title="Three phases, one owner each" unit="A phase ends when its exit test passes" cols={5}>
          <HarveyTable
            corner="When"
            showKey={false}
            columns={[
              { key: "what", label: "What happens", kind: "text", width: "54%" },
              { key: "owner", label: "Owner", kind: "text", width: "26%" },
            ]}
            rows={[
              { label: "M0–M3", cells: { what: "Sign hub lease; start fit-out", owner: "Operations" } },
              { label: "M3–M6", cells: { what: "Hire and train hub teams", owner: "People" } },
              { label: "M6–M9", cells: { what: "Move Northgate, then Riverside", owner: "Operations" } },
              { label: "M9", highlight: true, tag: "Done", cells: { what: "Both sites closed; cost per order below $7.30", owner: "Finance" } },
            ]}
          />
        </Panel>
        <SoWhat title="Tripwire" cols={5}>
          <p>
            If on-time delivery stays below <strong>88% for four weeks</strong>, we pause the Riverside move and keep the site
            open until service recovers.
          </p>
        </SoWhat>
      </ConsultingSlide>
    ),
    notes: {
      say: "Nine months, three phases, one owner each. Cash goes negative while both networks run, bottoming out around eight million, and turns positive in month fourteen. We call it done when cost per order is below seven dollars thirty, measured monthly by Finance. And if service drops below eighty-eight percent on time for four weeks, we pause the second move.",
      delivery: "Trace the line from the dip to the break-even point, then read the tripwire.",
      next: "So here is what we need from you.",
    },
  },
  {
    id: "ask",
    title: "Approve $9M by 14 March",
    headline: "Approve $9M by 14 March so Operations can sign the hub lease in Q2",
    role: "ask",
    render: () => (
      <ConsultingSlide
        tracker={tracker("Decision")}
        sticker={sticker}
        label={label}
        title="Approve $9M by 14 March so Operations can sign the hub lease in Q2"
        subtitle="Three decisions for the executive committee"
        rows="auto minmax(0, 1fr)"
        notes={["Run-rate saving forgone for each quarter the start slips, before one-off costs."]}
        source={source}
      >
        <Panel title="Decisions needed" unit="In order; the first unblocks the rest" cols={8}>
          <HarveyTable
            corner="Decision"
            showKey={false}
            columns={[
              { key: "owner", label: "Owner", kind: "text", width: "30%" },
              { key: "by", label: "By", kind: "text", width: "16%" },
            ]}
            rows={[
              { label: "Approve the $9M one-off budget", highlight: true, tag: "First", cells: { owner: "Executive committee", by: "14 March" } },
              { label: "Confirm both sites close in FY26", cells: { owner: "Chief operating officer", by: "14 March" } },
              { label: "Name a full-time transition lead", cells: { owner: "Operations", by: "31 March" } },
            ]}
          />
        </Panel>
        <Panel title="What the business gets" unit="Two-hub option, run-rate from FY27" cols={4} rows={2}>
          <KpiTiles
            columns={1}
            items={[
              { label: "Saving a year", value: "$14M", highlight: true },
              { label: "Payback", value: "14", unit: "months" },
              { label: "Cost per order", value: "$7.30", delta: { text: "−13%", direction: "down", sentiment: "good", period: "vs FY25" } },
            ]}
          />
        </Panel>
        <Panel title="Every quarter of delay forgoes $3.5M" unit={<>Saving forgone<Ref n={1} /> by start quarter, $M</>} cols={8}>
          <BarChart
            orientation="vertical"
            format={(v) => formatValue(v, { prefix: "$", suffix: "M", decimals: Number.isInteger(v) ? 0 : 1 })}
            data={[
              { label: "Start Q2", value: 0 },
              { label: "Q3", value: 3.5 },
              { label: "Q4", value: 7.0 },
              { label: "Next Q1", value: 10.5 },
            ]}
          />
        </Panel>
      </ConsultingSlide>
    ),
    notes: {
      say: "We need three decisions. First and most urgent: approve the nine million by the fourteenth of March, so Operations can sign the hub lease in the second quarter. Second, confirm that Northgate and Riverside close next year. Third, name a full-time transition lead by the end of March. Every quarter we wait forgoes about three and a half million. I own the business case and will bring the lease terms to the next review.",
      delivery: "Stop talking after the ask and wait for the decision.",
      next: "Take questions; the cost model is in the appendix pack.",
    },
  },
];
