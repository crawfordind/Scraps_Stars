import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";

export default function HomePage() {
  return (
    <main id="main-content">
      <header className="hero hero--barefeast">
        <h1 className="hero__wordmark">barefeast</h1>
        <div className="hero__rule" aria-hidden="true" />
        <p className="hero__tagline">A feast from almost nothing.</p>
        <p className="hero__alt stamp-label">Bare fridge. Full table.</p>
      </header>
      <Suspense fallback={null}>
        <AppShell />
      </Suspense>
    </main>
  );
}
