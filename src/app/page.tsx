import type { Metadata } from "next";
import "./landing/landing.css";
import { LandingScripts } from "./landing/LandingScripts";

const APP_URL = "/cook";
const GH_URL = "https://github.com/crawfordind/Scraps_Stars";

export const metadata: Metadata = {
  title: "barefeast — a feast from almost nothing",
  description:
    "Snap a photo of your fridge and barefeast hands you a real recipe — in a great chef’s voice, using only what you already own. Free, no account, open source.",
  openGraph: {
    title: "barefeast — a feast from almost nothing",
    description:
      "Snap a photo of your fridge. Cook a recipe from only what you have. No shopping, no account, no cost.",
    type: "website",
    siteName: "barefeast",
  },
};

function Wordmark() {
  return (
    <span className="lp-wordmark">
      bare<span className="feast">feast</span>
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="landing">
      <LandingScripts />

      {/* ---- Sticky header ---- */}
      <header className="lp-header">
        <div className="landing__wrap lp-header__inner">
          <a href="#hero" aria-label="barefeast — top of page">
            <Wordmark />
          </a>
          <div className="lp-nav">
            <nav className="lp-nav__links" aria-label="Primary">
              <a href="#how">How it works</a>
              <a href="#tiers">Tiers</a>
              <a href="#chefs">Chefs</a>
              <a href="#compare">Compare</a>
            </nav>
            <a className="lp-btn lp-btn--primary" href={APP_URL}>
              Start cooking
            </a>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* ---- Hero ---- */}
        <section id="hero" className="lp-hero" aria-labelledby="hero-h1">
          <div className="landing__wrap lp-hero__grid">
            <div>
              <span className="lp-eyebrow lp-hero__badge">FREE · NO PASSWORD · OPEN SOURCE</span>
              <div className="lp-hero__mark">
                <Wordmark />
              </div>
              <p className="lp-hero__tagline">A feast from almost nothing.</p>
              <h1 id="hero-h1" className="lp-hero__h1">
                Bare fridge. Full table.
              </h1>
              <p className="lp-hero__sub">
                Snap a photo of your fridge. barefeast reads what’s inside and hands you a real
                recipe — cooked in a great chef’s voice, using only what you already own. No
                shopping, no account, no cost.
              </p>
              <div className="lp-hero__actions">
                <a className="lp-btn lp-btn--primary" href={APP_URL}>
                  Cook from my fridge
                </a>
                <a className="lp-btn lp-btn--ghost" href="#how">
                  See how it works
                </a>
              </div>
              <p className="lp-trust lp-hero__trust">No password · Free · Open source</p>
            </div>

            {/* CSS "scan → feast" panel (no photo) */}
            <div className="lp-scan" aria-hidden="true">
              <div className="lp-card lp-scan__shot">
                <div className="lp-scan__cap">
                  <span>📸 Scanned shelf</span>
                  <span>25 items read</span>
                </div>
                <div className="lp-scan__items">
                  <span className="lp-chip">🥬 cabbage</span>
                  <span className="lp-chip">🧀 halloumi</span>
                  <span className="lp-chip">🥕 carrot</span>
                  <span className="lp-chip">🍋 lemon</span>
                  <span className="lp-chip">🧄 garlic</span>
                  <span className="lp-chip">🌶️ chili</span>
                  <span className="lp-chip">+ 19 more</span>
                </div>
              </div>
              <div className="lp-scan__arrow">↓ reads your shelf ↓</div>
              <div className="lp-card lp-scan__feast">
                <span className="lp-scan__tier">Tier 1 · Zero shopping</span>
                <p className="lp-scan__dish">Halloumi &amp; Cabbage Crisp Bowl</p>
                <p className="lp-scan__meta">25 min · Beginner · only what you own</p>
                <p className="lp-scan__voice">
                  “Char the cabbage hard — you want the edges singing, nothing thrown away.”
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---- Value props ---- */}
        <section className="lp-section lp-band-cream" aria-labelledby="props-h2">
          <div className="landing__wrap">
            <span className="lp-eyebrow">WHAT YOU GET</span>
            <h2 id="props-h2" className="lp-h2">
              A whole dinner, hiding in what you already have
            </h2>
            <ul className="lp-props">
              <li className="lp-card lp-prop" data-reveal>
                <span className="lp-prop__ic">📸</span>
                <p className="lp-prop__t">One photo, no typing</p>
                <p className="lp-prop__b">
                  Point your camera at a shelf; the AI reads up to 25 ingredients, spices and all,
                  and tells you how sure it is when a shot is fuzzy.
                </p>
              </li>
              <li className="lp-card lp-prop" data-reveal>
                <span className="lp-prop__ic">🧄</span>
                <p className="lp-prop__t">Cook zero-shopping</p>
                <p className="lp-prop__b">
                  Ask for a recipe made with only what you have. No list, no store run, no excuses.
                </p>
              </li>
              <li className="lp-card lp-prop" data-reveal>
                <span className="lp-prop__ic">🍳</span>
                <p className="lp-prop__t">A chef in your corner</p>
                <p className="lp-prop__b">
                  Pick a chef-inspired voice and cook alongside their commentary and a zero-waste
                  trick every time.
                </p>
              </li>
              <li className="lp-card lp-prop" data-reveal>
                <span className="lp-prop__ic">🌍</span>
                <p className="lp-prop__t">Every meal counts</p>
                <p className="lp-prop__b">
                  Watch the scraps you rescue add up: meals saved, kilos kept from the bin, dollars
                  back in your pocket.
                </p>
              </li>
            </ul>
          </div>
        </section>

        {/* ---- Stakes (mission, no CTA) ---- */}
        <section className="lp-section lp-band-oat" aria-labelledby="stakes-h2">
          <div className="landing__wrap lp-stakes__inner">
            <span className="lp-eyebrow lp-eyebrow--herb">WHY WE MADE THIS</span>
            <p id="stakes-h2" className="lp-stakes__quote">
              The food to fix your week is already in your fridge.
            </p>
            <p className="lp-lede" style={{ textAlign: "center" }}>
              Roughly a third of the world’s food is wasted, and about 40% of what a household buys
              gets thrown away — good ingredients, quietly binned, while too many tables stay bare.
              barefeast is a small, stubborn answer: cook what you have, waste less, eat well.
            </p>
            <div className="lp-stats">
              <div className="lp-stat">
                <div className="lp-stat__v">~1/3</div>
                <div className="lp-stat__l">of the world’s food is wasted</div>
              </div>
              <div className="lp-stat">
                <div className="lp-stat__v">~40%</div>
                <div className="lp-stat__l">of household food is thrown away</div>
              </div>
              <div className="lp-stat lp-stat--zero">
                <div className="lp-stat__v">$0</div>
                <div className="lp-stat__l">to cook your first feast</div>
              </div>
            </div>
          </div>
        </section>

        {/* ---- How it works ---- */}
        <section id="how" className="lp-section lp-band-cream" aria-labelledby="how-h2">
          <div className="landing__wrap">
            <span className="lp-eyebrow">HOW IT WORKS</span>
            <h2 id="how-h2" className="lp-h2">
              Photo to plate in three steps
            </h2>
            <ul className="lp-steps">
              <li className="lp-card lp-step" data-reveal>
                <span className="lp-step__n">01 —</span>
                <p className="lp-step__t">Snap your shelf</p>
                <p className="lp-step__b">
                  Photograph the fridge, the pantry, the sad drawer of odds and ends. The AI turns
                  the picture into your larder in seconds.
                </p>
              </li>
              <li className="lp-card lp-step" data-reveal>
                <span className="lp-step__n">02 —</span>
                <p className="lp-step__t">Pick a chef &amp; a tier</p>
                <p className="lp-step__b">
                  Choose your coach, then choose the rules: Tier 1 uses only what you own, Tier 2
                  lets you grab three things, Tier 3 opens the full list.
                </p>
              </li>
              <li className="lp-card lp-step" data-reveal>
                <span className="lp-step__n">03 —</span>
                <p className="lp-step__t">Cook it live</p>
                <p className="lp-step__b">
                  The recipe writes itself in front of you. Step into cook mode with timers — and
                  gripe if it’s off (“too spicy”, “no dairy”) to rewrite it on the spot.
                </p>
              </li>
            </ul>
            <div className="lp-how__foot">
              <a className="lp-textcta" href={APP_URL}>
                Start cooking →
              </a>
            </div>
          </div>
        </section>

        {/* ---- Tiers ---- */}
        <section id="tiers" className="lp-section lp-band-oat" aria-labelledby="tiers-h2">
          <div className="landing__wrap">
            <span className="lp-eyebrow">THE TIER SYSTEM</span>
            <h2 id="tiers-h2" className="lp-h2">
              You set the rules. It cooks inside them.
            </h2>
            <p className="lp-lede">
              This is the part nobody else does: tell barefeast how far you’re willing to go, and it
              writes a recipe that stays inside those walls.
            </p>
            <ul className="lp-tiers">
              <li className="lp-tier lp-tier--1" data-reveal>
                <div className="lp-tier__label">
                  Tier 1 · Strictly here
                  <span className="lp-tier__stamp">ZERO SHOPPING</span>
                </div>
                <div className="lp-tier__mark">🥬</div>
                <p className="lp-tier__t">Only what you own</p>
                <p className="lp-tier__b">
                  A complete recipe built from the ingredients already in your kitchen. No list, no
                  store run.
                </p>
              </li>
              <li className="lp-tier lp-tier--2" data-reveal>
                <div className="lp-tier__label">Tier 2 · Bridge the gap</div>
                <div className="lp-tier__mark">🛒</div>
                <p className="lp-tier__t">Add up to three</p>
                <p className="lp-tier__b">
                  Grab a maximum of three extra items to unlock a few more dishes without a full
                  shop.
                </p>
              </li>
              <li className="lp-tier lp-tier--3" data-reveal>
                <div className="lp-tier__label">Tier 3 · Full feast</div>
                <div className="lp-tier__mark">🌶️</div>
                <p className="lp-tier__t">Open the full list</p>
                <p className="lp-tier__b">
                  Want to go all out? Tier 3 opens a full shopping list and cooks with no limits.
                </p>
              </li>
            </ul>
            <div className="lp-ctaband" data-reveal>
              <span className="lp-ctaband__t">Cook Tier 1 tonight — with what’s already in there.</span>
              <a className="lp-btn lp-btn--primary" href={APP_URL}>
                Start cooking
              </a>
            </div>
          </div>
        </section>

        {/* ---- Chefs ---- */}
        <section id="chefs" className="lp-section lp-band-cream" aria-labelledby="chefs-h2">
          <div className="landing__wrap">
            <span className="lp-eyebrow">PICK A VOICE</span>
            <h2 id="chefs-h2" className="lp-h2">
              Cook like someone taught you
            </h2>
            <p className="lp-lede">
              Choose a chef-inspired coach and the whole recipe arrives in their style — the
              technique, the asides, the philosophy, and a zero-waste tip every time.
            </p>
            <ul className="lp-chefs">
              <li className="lp-card lp-chef" data-reveal>
                <div className="lp-chef__av">🍝</div>
                <p className="lp-chef__n">Bottura-style</p>
                <p className="lp-chef__style">PLAYFUL ITALIAN SOUL</p>
                <p className="lp-chef__q">“A nod to nonna — and nothing left behind.”</p>
                <span className="lp-chef__tip">saves the stems</span>
              </li>
              <li className="lp-card lp-chef" data-reveal>
                <div className="lp-chef__av">🥬</div>
                <p className="lp-chef__n">Waters-style</p>
                <p className="lp-chef__style">SIMPLE · SEASONAL</p>
                <p className="lp-chef__q">“Let the vegetable lead. Honest food, honestly cooked.”</p>
                <span className="lp-chef__tip">uses the peel</span>
              </li>
              <li className="lp-card lp-chef" data-reveal>
                <div className="lp-chef__av">🌶️</div>
                <p className="lp-chef__n">Ottolenghi-style</p>
                <p className="lp-chef__style">BOLD SPICE · BRIGHT ACID</p>
                <p className="lp-chef__q">“Generous plates from humble odds and ends.”</p>
                <span className="lp-chef__tip">revives the wilted</span>
              </li>
              <li className="lp-card lp-chef" data-reveal>
                <div className="lp-chef__av">🍛</div>
                <p className="lp-chef__n">Khanna-style</p>
                <p className="lp-chef__style">WARM · LAYERED SPICE</p>
                <p className="lp-chef__q">“Spice with intention; waste with none.”</p>
                <span className="lp-chef__tip">stretches leftovers</span>
              </li>
            </ul>
            <p className="lp-chefs__note">
              A chef-inspired style — an homage to their spirit, not the chefs themselves.
            </p>
          </div>
        </section>

        {/* ---- Features ---- */}
        <section className="lp-section lp-band-oat" aria-labelledby="feats-h2">
          <div className="landing__wrap">
            <span className="lp-eyebrow">UNDER THE HOOD</span>
            <h2 id="feats-h2" className="lp-h2">
              A real kitchen tool, not a party trick
            </h2>
            <ul className="lp-feats">
              <li className="lp-card lp-feat" data-reveal>
                <span className="lp-feat__ic">📸</span>
                <span className="lp-eyebrow">THE PANTRY SCAN</span>
                <p className="lp-feat__t">It reads your fridge better than you remember it</p>
                <p className="lp-feat__b">
                  One photo pulls out your ingredients — up to 25, spices flagged, confidence noted
                  when the shot is fuzzy. Then the tier system cooks inside the walls you set.
                </p>
                <ul className="lp-feat__list">
                  <li>Vision scan catches produce, staples, and seasonings in one frame</li>
                  <li>Tier 1: a full recipe from only what you have — zero shopping</li>
                  <li>Tiers 2 &amp; 3: add three items, or open the full list</li>
                </ul>
              </li>
              <li className="lp-card lp-feat" data-reveal>
                <span className="lp-feat__ic">🧭</span>
                <span className="lp-eyebrow">CHEFS &amp; COACHING</span>
                <p className="lp-feat__t">A coach who greets you by name</p>
                <p className="lp-feat__b">
                  Your AI Kitchen Coach opens with a hook, your next best move, and a little dare to
                  keep it fun — while recipes arrive in your chosen chef’s style.
                </p>
                <ul className="lp-feat__list">
                  <li>Recipes and commentary in your chosen chef-inspired style</li>
                  <li>A warm briefing: greeting, next action, tip, and a challenge</li>
                  <li>A personal food-security score that tracks your kitchen’s reach</li>
                </ul>
              </li>
              <li className="lp-card lp-feat" data-reveal>
                <span className="lp-feat__ic">✍️</span>
                <span className="lp-eyebrow">LIVE &amp; FLEXIBLE</span>
                <p className="lp-feat__t">The recipe writes itself — then bends to you</p>
                <p className="lp-feat__b">
                  Watch it stream in real time, then step into cook mode with timers. Don’t like
                  something? Gripe, and it rewrites on the spot.
                </p>
                <ul className="lp-feat__list">
                  <li>Recipes stream live as they’re written</li>
                  <li>Revise by griping: “too spicy”, “no dairy” → instant rewrite</li>
                  <li>Cook mode with step-by-step timers</li>
                </ul>
              </li>
              <li className="lp-card lp-feat" data-reveal>
                <span className="lp-feat__ic">🏆</span>
                <span className="lp-eyebrow">PROGRESS &amp; IMPACT</span>
                <p className="lp-feat__t">Small dinners, real numbers</p>
                <p className="lp-feat__b">
                  Every meal from scraps earns XP, feeds a streak, and climbs the leaderboard — with
                  a shareable win card, and a dashboard doing math you’d never do yourself.
                </p>
                <ul className="lp-feat__list">
                  <li>XP, levels, streaks, daily challenges, and win cards</li>
                  <li>Counts meals saved, ingredients rescued, and kilos kept whole</li>
                  <li>Real totals for money saved, CO₂ avoided, and water spared</li>
                </ul>
              </li>
            </ul>
          </div>
        </section>

        {/* ---- Impact (dark band) ---- */}
        <section className="lp-section lp-impact" aria-labelledby="impact-h2">
          <div className="landing__wrap">
            <span className="lp-eyebrow lp-eyebrow--herb">THE SCOREBOARD</span>
            <h2 id="impact-h2" className="lp-h2">
              Saving scraps, made into a score you want to grow
            </h2>
            <p className="lp-lede">
              barefeast quietly keeps count of what your cooking rescues — so a small weeknight
              dinner turns into something you can actually see add up.
            </p>
            <ul className="lp-impact__grid">
              <li className="lp-metric" data-reveal>
                <div className="lp-metric__v">🍲 Meals</div>
                <div className="lp-metric__l">saved from the bin</div>
              </li>
              <li className="lp-metric" data-reveal>
                <div className="lp-metric__v">🥬 Ingredients</div>
                <div className="lp-metric__l">rescued and used</div>
              </li>
              <li className="lp-metric" data-reveal>
                <div className="lp-metric__v">⚖️ Kilos</div>
                <div className="lp-metric__l">kept out of the waste stream</div>
              </li>
              <li className="lp-metric lp-metric--warm" data-reveal>
                <div className="lp-metric__v">💵 Dollars</div>
                <div className="lp-metric__l">back in your pocket</div>
              </li>
              <li className="lp-metric" data-reveal>
                <div className="lp-metric__v">🌱 CO₂</div>
                <div className="lp-metric__l">avoided</div>
              </li>
              <li className="lp-metric" data-reveal>
                <div className="lp-metric__v">💧 Water</div>
                <div className="lp-metric__l">spared</div>
              </li>
            </ul>
            <div className="lp-wincard" data-reveal>
              <span className="lp-wincard__badge">🏅</span>
              <div>
                <p className="lp-wincard__t">Halloumi &amp; Cabbage Crisp Bowl</p>
                <p className="lp-wincard__s">Tier 1 · cooked from only what was in the fridge</p>
              </div>
              <span className="lp-wincard__xp">+75 XP</span>
            </div>
          </div>
        </section>

        {/* ---- Compare ---- */}
        <section id="compare" className="lp-section lp-band-cream" aria-labelledby="compare-h2">
          <div className="landing__wrap">
            <span className="lp-eyebrow">HOW IT STACKS UP</span>
            <h2 id="compare-h2" className="lp-h2">
              What barefeast does that most recipe apps don’t
            </h2>
            <p className="lp-lede">
              Plenty of apps do one piece of this. barefeast is the one that bundles all of it — into
              one warm, free, open-source flow.
            </p>
            <div className="lp-compare__wrap">
              <table className="lp-table">
                <caption className="lp-eyebrow" style={{ padding: "0.9rem 1.1rem", display: "block", textAlign: "left" }}>
                  barefeast vs. typical recipe apps
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="lp-table__feat">
                      Feature
                    </th>
                    <th scope="col" className="lp-col-bf">
                      barefeast
                    </th>
                    <th scope="col">Typical recipe apps</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Cook using only what you already own", "Rarely"],
                    ["Reads your fridge from a photo", "Rarely"],
                    ["Recipes in a chef’s voice + zero-waste tips", "No"],
                    ["The recipe writes itself, live", "No"],
                    ["Revise by griping (“too spicy”)", "No"],
                    ["No account, no password", "Usually not"],
                    ["Free, no paywall", "Sometimes"],
                    ["Open source (MIT)", "No"],
                  ].map(([feat, typical]) => (
                    <tr key={feat}>
                      <th scope="row" className="lp-table__feat">
                        {feat}
                      </th>
                      <td className="lp-col-bf">
                        <span className="lp-yes">
                          <span className="lp-yes__g" aria-hidden="true">
                            ✓
                          </span>
                          <span>Yes</span>
                        </span>
                      </td>
                      <td>
                        <span className="lp-no">{typical}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="lp-compare__cta">
              <a className="lp-btn lp-btn--primary" href={APP_URL}>
                Start cooking
              </a>
            </div>
          </div>
        </section>

        {/* ---- FAQ ---- */}
        <section className="lp-section lp-band-oat" aria-labelledby="faq-h2">
          <div className="landing__wrap">
            <span className="lp-eyebrow">GOOD QUESTIONS</span>
            <h2 id="faq-h2" className="lp-h2">
              The stuff you’re about to ask
            </h2>
            <div className="lp-faq">
              <details>
                <summary>Is it actually free?</summary>
                <p className="lp-faq__a">
                  Yes — genuinely, no catch. barefeast runs on free AI models, so there’s no marginal
                  cost and no paywall waiting a few clicks in.
                </p>
              </details>
              <details>
                <summary>Do I need an account?</summary>
                <p className="lp-faq__a">
                  No. Give your first name or continue as a guest — there’s no password to create,
                  and it still remembers your larder, recipes, and coach notes for next time.
                </p>
              </details>
              <details>
                <summary>How accurate is the photo scan?</summary>
                <p className="lp-faq__a">
                  It reads up to 25 ingredients from a single shot and flags spices as it goes. When
                  a photo is blurry it tells you how confident it is, so you’re never guessing what
                  it guessed.
                </p>
              </details>
              <details>
                <summary>What happens to my photo?</summary>
                <p className="lp-faq__a">
                  Your photo is uploaded and sent to an AI vision model for one purpose: to read the
                  ingredients in it. Because barefeast is fully open source, you can see exactly how
                  images are handled in the code — and change it if you’d do it differently.
                </p>
              </details>
              <details>
                <summary>Is it open source?</summary>
                <p className="lp-faq__a">
                  Fully. barefeast is MIT-licensed and public on GitHub — read the code, fork it, or
                  build on it. Nothing hidden in the pantry.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* ---- Final CTA (ember band) ---- */}
        <section className="lp-section lp-final" aria-labelledby="final-h2">
          <div className="landing__wrap">
            <h2 id="final-h2" className="lp-final__t">
              Your fridge is more of a feast than you think.
            </h2>
            <p className="lp-final__s">
              One photo. One chef. One dinner rescued from the bin. Start cooking in ten seconds — no
              password, no cost.
            </p>
            <div className="lp-final__actions">
              <a className="lp-btn lp-btn--onember" href={APP_URL}>
                Cook from my fridge
              </a>
            </div>
            <p className="lp-trust lp-final__trust">No password · Free · Open source</p>
          </div>
        </section>
      </main>

      {/* ---- Footer ---- */}
      <footer className="lp-footer">
        <div className="landing__wrap">
          <div className="lp-footer__grid">
            <div className="lp-footer__mark">
              <Wordmark />
              <p className="lp-footer__tag">A feast from almost nothing.</p>
            </div>
            <div className="lp-footer__col">
              <h4>Explore</h4>
              <ul>
                <li>
                  <a href="#how">How it works</a>
                </li>
                <li>
                  <a href="#tiers">Tiers</a>
                </li>
                <li>
                  <a href="#chefs">Chefs</a>
                </li>
                <li>
                  <a href="#compare">Compare</a>
                </li>
              </ul>
            </div>
            <div className="lp-footer__col">
              <h4>Project</h4>
              <ul>
                <li>
                  <a href={APP_URL}>Open the app</a>
                </li>
                <li>
                  <a href={GH_URL}>GitHub repo</a>
                </li>
                <li>
                  <a href={`${GH_URL}/blob/main/LICENSE`}>MIT license</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="lp-footer__legal">
            <span>Open source · MIT licensed</span>
            <span>·</span>
            <span>Cook what you have. Waste less. Eat well.</span>
            <span>·</span>
            <a href={APP_URL}>Start cooking →</a>
          </div>
        </div>
      </footer>

      {/* ---- Mobile sticky CTA ---- */}
      <div id="lp-mobilecta" className="lp-mobilecta">
        <a className="lp-btn lp-btn--primary" href={APP_URL} aria-hidden="true" tabIndex={-1}>
          Start cooking
        </a>
      </div>
    </div>
  );
}
