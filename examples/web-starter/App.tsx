// A complete landing page with every uipack/web block wired, for a sample product (Tallyroom, which
// matches a small business's bank CSV against its invoices). Copy this folder into a Vite + React
// app (`npm i uipack react react-dom`), then replace the words and rows with your product's own.
//
// The rule it follows: show the product's real output. The hero demo settles on the product's own
// screens (a file, the matches, a record), the mechanism is one worked calculation with real
// numbers, and the proof is a measured before/after. Every number here is sample data: replace it
// with yours, or cut the block. No colours or fonts in this file; the style paints everything.
import {
  Brand,
  ClosingCta,
  CtaButton,
  DataTable,
  DemoPlayer,
  FAQ,
  FeatureGrid,
  FileTable,
  GlassNav,
  Grid,
  GridItem,
  ItemList,
  PricingPlans,
  ProductWindow,
  Proof,
  RecordCard,
  ScheduleGrid,
  Section,
  SiteFooter,
  StarHero,
  WebPage,
  WorkedExample,
  type DemoStep,
  type FaqItem,
  type PricingPlan,
} from "uipack/web";
import type { UiStyleId } from "uipack";

const CTA = { label: "Start a free trial", short: "Try free", href: "#pricing" };
const nav = [
  { label: "How it works", href: "#how" },
  { label: "Matching", href: "#matching" },
  { label: "Results", href: "#proof" },
  { label: "Pricing", href: "#pricing" },
];

// ---- The product's output, as rows (replace with yours) ----
const bankRows = [
  { date: "02 Oct", payee: "Harbour Print Ltd", amount: "−£412.80", status: "Matched" },
  { date: "03 Oct", payee: "Stripe payout", amount: "+£2,184.00", status: "Matched" },
  { date: "05 Oct", payee: "K. Okafor", amount: "+£650.00", status: "Check" },
  { date: "06 Oct", payee: "Office rent", amount: "−£1,250.00", status: "Matched" },
  { date: "09 Oct", payee: "AWS EMEA", amount: "−£88.14", status: "Matched" },
];

const demoSteps: DemoStep[] = [
  {
    id: "import",
    label: "Import",
    title: "Read the bank export",
    actions: [{ label: "Import CSV", detail: "42 lines" }],
    screen: (
      <FileTable
        fileName="barclays-oct.csv"
        summary="42 lines · 1 account · October"
        status="Imported"
        columns={[
          { key: "date", label: "Date" },
          { key: "payee", label: "Payee" },
          { key: "amount", label: "Amount", align: "end" },
          { key: "status", label: "Status", align: "end" },
        ]}
        rows={bankRows}
        highlight={2}
      />
    ),
  },
  {
    id: "match",
    label: "Match",
    title: "Match each line to an invoice or a rule",
    actions: [{ label: "Match lines", detail: "36 of 42" }],
    screen: (
      <ItemList
        label="Lines that need you"
        items={[
          { title: "K. Okafor · +£650.00", detail: "Two open invoices for £650", meta: "Pick one", status: "attention" },
          { title: "Unknown card · −£23.99", detail: "No receipt yet", meta: "Ask", status: "attention" },
          { title: "Stripe payout · +£2,184.00", detail: "Split across 14 invoices", meta: "Done", status: "done" },
          { title: "Office rent · −£1,250.00", detail: "Rule: rent, monthly", meta: "Done", status: "done" },
        ]}
      />
    ),
  },
  {
    id: "review",
    label: "Review",
    title: "Confirm the six you need to see",
    actions: [{ label: "Ready for your accountant", detail: "6 to confirm" }],
    // The last screen is the one a still capture shows: make it the fullest.
    screen: (
      <>
        <RecordCard
          eyebrow="October close"
          title="Barclays business account"
          status="6 to confirm"
          fields={[
            { label: "Lines", value: "42" },
            { label: "Matched", value: "36" },
            { label: "To confirm", value: "6" },
            { label: "Closing balance", value: "£18,402.66" },
          ]}
        />
        <ItemList
          label="Lines to confirm"
          items={[
            { title: "K. Okafor · +£650.00", detail: "INV-1041, 92 points", meta: "Confirm", status: "attention" },
            { title: "Unknown card · −£23.99", detail: "Receipt requested", meta: "Waiting", status: "pending" },
            { title: "HMRC · −£1,904.00", detail: "VAT Q3, rule suggested", meta: "Confirm", status: "attention" },
          ]}
        />
      </>
    ),
  },
];

const steps = [
  { title: "Connect your bank", body: "Drop in a CSV or connect the account; Tallyroom reads every line." },
  { title: "Let it match", body: "Each line is matched to an invoice, a receipt or one of your rules." },
  { title: "Confirm the rest", body: "You see only the lines it could not match, with its best guess." },
];

const faq: FaqItem[] = [
  { question: "Which banks work?", answer: "Any bank that exports CSV; twelve UK banks also connect directly." },
  { question: "Does my accountant need an account?", answer: "No. Share a read-only link to the closed month." },
  { question: "What if a match is wrong?", answer: "Undo it from the line; the rule that made it is shown beside it." },
  { question: "What does it cost after the trial?", answer: "£19 a month for one business, £49 for up to five. See pricing." },
];

const plans: PricingPlan[] = [
  {
    name: "Solo",
    price: "£19",
    period: "a month",
    summary: "One business.",
    features: ["One business", "Unlimited lines", "14 days free"],
    action: { label: CTA.label, href: CTA.href },
    featured: true,
  },
  {
    name: "Practice",
    price: "£49",
    period: "a month",
    summary: "For bookkeepers.",
    features: ["Up to five businesses", "Unlimited lines", "14 days free"],
    // Each plan's button says what its click does; only the featured one repeats the page's goal.
    action: { label: "Try Practice free", href: "#pricing" },
  },
];

// Omit `theme` to follow the system; pass "light" or "dark" to force one.
export default function App({ uiStyle, theme }: { uiStyle: UiStyleId; theme?: "light" | "dark" }) {
  return (
    <WebPage
      uiStyle={uiStyle}
      theme={theme}
      nav={
        // The CTA as data: `short` is the label a phone's bar shows beside Menu.
        <GlassNav brand={<Brand href="#top">Tallyroom</Brand>} links={nav} cta={CTA} />
      }
      sections={{
        hero: (
          <div id="top">
            {/* layout="split": copy beside the product from 1024px (no empty half above it). The
                stamp carries the page's one measured number in the style's own device. */}
            <StarHero
              layout="split"
              stamp={{ value: "2 h", label: "median close, was ~9 h" }}
              eyebrow="Bookkeeping for small businesses"
              title={
                <>
                  Month-end in an afternoon, <em>not a weekend.</em>
                </>
              }
              subtitle="Tallyroom matches your bank export against your invoices and receipts, and leaves you only the lines it could not match."
              actions={
                <>
                  <CtaButton size="lg" href={CTA.href}>
                    {CTA.label}
                  </CtaButton>
                  <CtaButton size="lg" variant="secondary" href="#matching">
                    See how matching works
                  </CtaButton>
                </>
              }
            >
              {/* No prompt on any step, so the player runs in "steps" mode: the product's screen at
                  full width under one compact row of step labels (rail="compact", the default;
                  the "How it works" section lists the steps in full). It rests on the last screen,
                  so make that the fullest. */}
              <DemoPlayer label="Sample run: closing October" address="app.tallyroom.example/close" steps={demoSteps} />
            </StarHero>
          </div>
        ),
        how: (
          <Section
            id="how"
            eyebrow="How it works"
            title="Three steps, and you only do the last."
            intro="Set up once; each month after that is a review."
          >
            <FeatureGrid features={steps} numbered />
          </Section>
        ),
        matching: (
          <Section
            id="matching"
            eyebrow="How matching works"
            title="Every line gets a reason you can check."
            intro="A line matches when its amount, date and payee agree with an invoice, or when one of your rules says so."
          >
            <Grid>
              <GridItem span={[7, 8, 4]}>
                <ProductWindow
                  label="Match scores for a payment"
                  title="+£650.00 from K. Okafor"
                  subtitle="Candidates, best first"
                  status="Needs you"
                  source="Sample data"
                >
                  <DataTable
                    label="Candidate invoices for the payment"
                    columns={[
                      { key: "invoice", label: "Invoice" },
                      { key: "score", label: "Score", barMax: 100 },
                      // priority "low": dropped first when the table is narrow (a phone).
                      { key: "days", label: "Days apart", align: "end", priority: "low" },
                    ]}
                    rows={[
                      { invoice: "INV-1041", score: 92, days: 2 },
                      { invoice: "INV-1038", score: 88, days: 9 },
                      { invoice: "INV-0997", score: 41, days: 38 },
                    ]}
                    highlight={0}
                  />
                </ProductWindow>
              </GridItem>
              <GridItem span={[5, 8, 4]}>
                <WorkedExample
                  title="Score for INV-1041"
                  given={{ value: "100", label: "points to start" }}
                  lines={[
                    {
                      rule: "Amount agrees to the penny",
                      working: "£650.00 = £650.00",
                      result: { value: "100", label: "points kept" },
                    },
                    { rule: "Two days apart, −4 a day", working: "100 − 2 × 4 = 92", result: { value: "92", label: "score" } },
                  ]}
                  note="Two invoices above 85 points: Tallyroom asks rather than guesses."
                />
              </GridItem>
            </Grid>
          </Section>
        ),
        calendar: (
          <Section
            id="calendar"
            eyebrow="Month-end"
            title="Who closes what, and when."
            intro="A practice sees every client's close on one grid."
          >
            <ScheduleGrid
              label="October close by client and day"
              corner="Client"
              offLabel=""
              columns={["Mon 30", "Tue 31", "Wed 1", "Thu 2", "Fri 3"]}
              rows={[
                { name: "Harbour Print", detail: "Solo", cells: ["Import", "Match", { value: "Confirm", tone: "peak" }, "", ""] },
                { name: "Okafor Studio", detail: "Solo", cells: ["", "Import", "Match", { value: "Confirm", tone: "peak" }, ""] },
                {
                  name: "Leaf & Loom",
                  detail: "Practice",
                  cells: ["", "", "Import", "Match", { value: "Confirm", tone: "peak" }],
                },
              ]}
              legend={[
                { tone: "shift", label: "Automatic" },
                { tone: "peak", label: "Needs a person" },
              ]}
            />
          </Section>
        ),
        proof: (
          <Section
            id="proof"
            tone="secondary"
            eyebrow="Results"
            title="Close took 2 hours, down from about 9."
            intro="Median across 40 trial businesses, sample data."
          >
            <Proof
              compare={{
                change: "2 hours",
                before: { value: "~9 h", label: "by hand, owners' estimate", measure: 540 },
                after: { value: "2 h", label: "with Tallyroom, median", measure: 120 },
              }}
              stats={[
                { value: "86%", label: "lines matched automatically" },
                { value: "40", label: "trial businesses" },
              ]}
              quote={{
                text: "I close October on the first of November now.",
                name: "Sample Name",
                role: "Owner, sample business",
              }}
            />
          </Section>
        ),
        faq: <FAQ id="faq" eyebrow="Questions" title="What owners ask first." items={faq} url="https://tallyroom.example/" />,
        pricing: (
          <Section
            id="pricing"
            eyebrow="Pricing"
            title={
              <>
                Fourteen days free, then <em>£19 a month.</em>
              </>
            }
          >
            <PricingPlans plans={plans} note="Sample prices in GBP." />
          </Section>
        ),
        closing: (
          <ClosingCta
            id="start"
            eyebrow="Start"
            title="Close this month in an afternoon."
            intro="Drop in last month's CSV and see what is left to confirm."
            action={CTA}
            note="14 days free. No card."
          />
        ),
      }}
    >
      <SiteFooter
        brand={<Brand href="#top">Tallyroom</Brand>}
        links={nav}
        note="Tallyroom is a sample product for the uipack web starter."
      />
    </WebPage>
  );
}
