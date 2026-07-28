import { CookExperience } from "@/components/CookExperience";

/**
 * /showcase — showcase route for the three UI pillars.
 * Hub → Active cooking → Reward bursts in one integrated flow.
 */
export default function ShowcasePage() {
  return (
    <main id="main-content" className="cook-page">
      <header className="hero hero--barefeast cook-page__hero">
        <p className="stamp-label hero__alt">cook mode</p>
        <h1 className="hero__wordmark">barefeast</h1>
        <div className="hero__rule" aria-hidden="true" />
        <p className="hero__tagline">
          Hands on the counter, feast on the table — built for the kitchen, not the couch.
        </p>
      </header>
      <CookExperience />
    </main>
  );
}
