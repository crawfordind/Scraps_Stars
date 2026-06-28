import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="public-page" style={{ textAlign: "center" }}>
      <header className="public-page__hero">
        <p className="public-page__eyebrow">barefeast</p>
        <h1>This table is empty</h1>
        <p className="public-page__meta">We couldn&apos;t find that page.</p>
      </header>
      <div className="public-page__cta-row">
        <Link href="/" className="primary-btn">
          Back to barefeast
        </Link>
      </div>
    </main>
  );
}
