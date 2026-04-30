import { ArrowLeft } from 'lucide-react';
import ScrollUnlock from './ScrollUnlock';

export const metadata = {
  title: 'Dietitian Mode — FoodRoller Guide',
  description: 'How to use FoodRoller to manage clients, generate shareable meal plans, and apply AI macro planning at scale.',
};

function Section({ id, number, title, children }) {
  return (
    <section id={id} className="dg-section">
      <div className="dg-section-number">{number}</div>
      <div className="dg-section-body">
        <h2 className="dg-section-title">{title}</h2>
        {children}
      </div>
    </section>
  );
}

function Step({ n, children }) {
  return (
    <div className="dg-step">
      <span className="dg-step-n">{n}</span>
      <p>{children}</p>
    </div>
  );
}

function Note({ children }) {
  return <div className="dg-note">{children}</div>;
}

function Callout({ children }) {
  return <div className="dg-callout">{children}</div>;
}

export default function DietitianGuide() {
  return (
    <div className="dg-page">
      <ScrollUnlock />
      <a href="/" className="dg-back">
        <ArrowLeft size={14} strokeWidth={2} /> Back to FoodRoller
      </a>

      <header className="dg-header">
        <p className="dg-header-label">FoodRoller for Professionals</p>
        <h1 className="dg-header-title">Dietitian Mode Guide</h1>
        <p className="dg-header-subtitle">
          Everything you need to manage clients, build personalised meal plans, and share them — all in one place.
        </p>
        <nav className="dg-toc">
          <a href="#activate">Activating Dietitian Mode</a>
          <a href="#clients">Managing Clients</a>
          <a href="#share">Sharing Meal Plans</a>
          <a href="#ai">AI Meal Planning</a>
        </nav>
      </header>

      <main className="dg-main">

        {/* ── SECTION 1 ── */}
        <Section id="activate" number="01" title="Activating Dietitian Mode">
          <p className="dg-lead">
            Dietitian Mode unlocks client profiles, shareable plan links, and multi-client macro switching. It is free during the current beta.
          </p>
          <Step n={1}>Sign in to your FoodRoller account. If you don't have one, click <strong>Log in</strong> in the top-right corner and create an account.</Step>
          <Step n={2}>Once signed in, click the <strong>Dietitian mode</strong> button in the top-right navigation bar.</Step>
          <Step n={3}>You will see a confirmation. Your account is immediately upgraded — the <strong>Clients</strong> button appears in the nav bar.</Step>
          <Note>Dietitian Mode is tied to your account and persists across sessions. You only need to activate it once.</Note>
        </Section>

        {/* ── SECTION 2 ── */}
        <Section id="clients" number="02" title="Managing Clients">
          <p className="dg-lead">
            Each client has their own macro profile. Switching to a client's profile lets you build and share a plan tailored to their exact nutritional targets.
          </p>

          <h3 className="dg-sub">Adding a client</h3>
          <Step n={1}>Click <strong>Clients</strong> in the nav bar to open the Client Manager.</Step>
          <Step n={2}>Click <strong>+ Add</strong> in the sidebar.</Step>
          <Step n={3}>Fill in the client's name and macro targets (kcal, protein, carbs, fat). Optionally set their goal and any dietary restrictions.</Step>
          <Step n={4}>Click <strong>Save</strong>. The client appears in the sidebar immediately.</Step>

          <h3 className="dg-sub">Building a plan for a client</h3>
          <Step n={1}>In the Client Manager, find the client and click <strong>Plan for client →</strong>.</Step>
          <Step n={2}>The modal closes and the app switches into that client's macro context. You'll see their name highlighted in the nav bar.</Step>
          <Step n={3}>Use the plan grid, AI planner, or manual meal additions as normal. All macro calculations now use the client's targets.</Step>
          <Step n={4}>When done, click <strong>×</strong> next to the client's name in the nav bar to return to your own plan.</Step>

          <h3 className="dg-sub">Editing or deleting a client</h3>
          <Step n={1}>Open the Client Manager and click the <strong>✎ edit</strong> icon next to the client.</Step>
          <Step n={2}>Update any fields and click <strong>Save</strong>. Or click the <strong>✕ delete</strong> icon and confirm to remove the client.</Step>
          <Note>Client data is stored in your account on Firestore. It is private and never visible to the client.</Note>
        </Section>

        {/* ── SECTION 3 ── */}
        <Section id="share" number="03" title="Sharing Meal Plans">
          <p className="dg-lead">
            Generate a read-only link for any planned week. The client opens it in any browser — no account required — and sees their meals, macros, and shopping list.
          </p>

          <h3 className="dg-sub">Generating a link</h3>
          <Step n={1}>Switch to the client whose plan you want to share (see above).</Step>
          <Step n={2}>In the plan view, click the <strong>Share</strong> button in the bottom action bar.</Step>
          <Step n={3}>Adjust the date range if needed and add an optional plan title (e.g. "Week of May 5").</Step>
          <Step n={4}>Click <strong>Generate Link</strong>. Copy the URL and send it to your client via email, WhatsApp, or any other channel.</Step>
          <Callout>Links expire after <strong>30 days</strong>. Generate a new one when starting a fresh plan week.</Callout>

          <h3 className="dg-sub">What the client sees</h3>
          <p>When the client opens the link they see:</p>
          <ul className="dg-list">
            <li><strong>Day-by-day meal cards</strong> — recipe name, photo, and macro breakdown per meal.</li>
            <li><strong>Daily macro totals</strong> — colour-coded against their targets (green = on track, amber = under, red = over).</li>
            <li><strong>Merged shopping list</strong> — all ingredients combined across the week, with quantities summed.</li>
          </ul>

          <h3 className="dg-sub">Printing or saving as PDF</h3>
          <Step n={1}>Click <strong>Print / PDF</strong> at the top of the shared plan page.</Step>
          <Step n={2}>In the browser print dialog, select <strong>Save as PDF</strong> as the destination.</Step>
          <Note>The print layout hides the browser UI and formats the plan cleanly across pages, with your name shown as the plan author.</Note>

          <h3 className="dg-sub">Snapshot model</h3>
          <p>
            Shared links are <strong>snapshots</strong>. Changes you make to the plan after generating a link are not reflected in the link. If you update the plan, generate a new link and send it to the client.
          </p>
        </Section>

        {/* ── SECTION 4 ── */}
        <Section id="ai" number="04" title="AI Meal Planning">
          <p className="dg-lead">
            FoodRoller's AI planner generates a full week of meals that fit a client's macro targets, dietary restrictions, and meal slots — in one click.
          </p>

          <h3 className="dg-sub">Requirements</h3>
          <ul className="dg-list">
            <li>The client's macro profile must be set (kcal, protein, carbs, fat).</li>
            <li>You must be in the client's macro context (their name shown in the nav bar).</li>
          </ul>

          <h3 className="dg-sub">Plan My Week</h3>
          <Step n={1}>Switch to the client's profile.</Step>
          <Step n={2}>Set the date range using the timeframe picker at the top of the plan view.</Step>
          <Step n={3}>Click <strong>Plan My Week</strong> in the bottom action bar.</Step>
          <Step n={4}>The AI generates meals for each slot across the selected days, targeting the client's macros. Review the preview and click <strong>Apply</strong> to fill the plan.</Step>
          <Step n={5}>Swap any individual meal using the <strong>↺ reroll</strong> button on a slot card.</Step>

          <h3 className="dg-sub">Macro-aware reroll</h3>
          <p>
            The <strong>↺ reroll</strong> button on any slot uses the client's <em>remaining</em> daily macros (target minus meals already planned that day) to pick the best-fitting recipe. This works meal-by-meal, so you can build a plan incrementally without over- or under-shooting targets.
          </p>

        </Section>

      </main>

      <footer className="dg-footer">
        <p>FoodRoller Dietitian Mode is currently in beta. Features and pricing subject to change.</p>
        <a href="/" className="dg-back">← Back to FoodRoller</a>
      </footer>
    </div>
  );
}
