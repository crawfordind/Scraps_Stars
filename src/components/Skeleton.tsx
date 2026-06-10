import type { CSSProperties, HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
};

export function Skeleton({
  width,
  height,
  radius,
  className = "",
  style,
  ...props
}: SkeletonProps) {
  const inlineStyle: CSSProperties = {
    ...style,
    ...(width != null && { width: typeof width === "number" ? `${width}px` : width }),
    ...(height != null && { height: typeof height === "number" ? `${height}px` : height }),
    ...(radius != null && { borderRadius: typeof radius === "number" ? `${radius}px` : radius }),
  };

  return (
    <div
      className={`skeleton ${className}`.trim()}
      style={inlineStyle}
      aria-hidden
      {...props}
    />
  );
}

type SkeletonTextProps = {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
};

export function SkeletonText({
  lines = 3,
  className = "",
  lastLineWidth = "65%",
}: SkeletonTextProps) {
  return (
    <div className={`skeleton-text ${className}`.trim()} aria-hidden>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          height="0.85rem"
          width={index === lines - 1 ? lastLineWidth : "100%"}
          radius="var(--radius-sm)"
          className="skeleton-text__line"
        />
      ))}
    </div>
  );
}

type SkeletonCircleProps = {
  size?: string | number;
  className?: string;
};

export function SkeletonCircle({ size = 48, className = "" }: SkeletonCircleProps) {
  const dim = typeof size === "number" ? `${size}px` : size;
  return <Skeleton width={dim} height={dim} radius="50%" className={className} />;
}

function DealStoreSkeleton() {
  return (
    <article className="deal-store skeleton-deal-store" aria-hidden>
      <header className="deal-store__header">
        <SkeletonCircle size="2.25rem" />
        <div className="deal-store__meta">
          <Skeleton width="70%" height="0.88rem" radius="var(--radius-sm)" />
          <Skeleton width="3rem" height="0.72rem" radius="var(--radius-sm)" />
        </div>
      </header>
      <ul className="deal-store__items">
        {[0, 1].map((index) => (
          <li key={index} className="deal-item">
            <Skeleton width="100%" height="0.86rem" radius="var(--radius-sm)" />
            <Skeleton width="55%" height="0.92rem" radius="var(--radius-sm)" />
            <Skeleton width="4.5rem" height="1.1rem" radius="var(--radius-sm)" />
          </li>
        ))}
      </ul>
    </article>
  );
}

export function HomeSkeleton() {
  return (
    <div className="kitchen-home skeleton-screen" aria-busy="true" aria-label="Preparing your kitchen">
      <p className="sr-only">Preparing your kitchen…</p>

      <section className="home-hero">
        <div className="home-hero__top">
          <div className="security-meter">
            <SkeletonCircle size="5.25rem" />
            <Skeleton width="4.5rem" height="0.7rem" radius="var(--radius-sm)" />
          </div>
          <div className="home-hero__copy">
            <Skeleton width="55%" height="0.7rem" radius="var(--radius-sm)" />
            <Skeleton width="78%" height="1.45rem" radius="var(--radius-sm)" />
            <SkeletonText lines={2} lastLineWidth="88%" />
          </div>
        </div>
        <Skeleton width="100%" height="3.25rem" radius="var(--radius-md)" />
      </section>

      <div className="home-quick-stats home-quick-stats--glance">
        {[0, 1].map((index) => (
          <article key={index} className="home-stat" aria-hidden>
            <Skeleton width="3.5rem" height="1.1rem" radius="var(--radius-sm)" className="skeleton--centered" />
            <Skeleton width="5rem" height="0.68rem" radius="var(--radius-sm)" className="skeleton--centered skeleton--mt" />
          </article>
        ))}
      </div>

      <section className="deals-section skeleton-deals" aria-hidden>
        <header className="deals-section__header">
          <Skeleton width="4rem" height="0.68rem" radius="var(--radius-sm)" />
          <Skeleton width="10rem" height="1.05rem" radius="var(--radius-sm)" className="skeleton--mt-sm" />
          <SkeletonText lines={2} lastLineWidth="72%" className="skeleton--mt-sm" />
        </header>
        <div className="deals-section__scroll">
          <DealStoreSkeleton />
          <DealStoreSkeleton />
        </div>
      </section>

      <section className="panel home-cards" aria-hidden>
        {[0, 1].map((index) => (
          <article key={index} className="home-card">
            <SkeletonCircle size="1.75rem" />
            <div className="home-card__body">
              <Skeleton width="45%" height="0.85rem" radius="var(--radius-sm)" />
              <SkeletonText lines={2} lastLineWidth="80%" className="skeleton--mt-sm" />
            </div>
          </article>
        ))}
      </section>

      <Skeleton width="100%" height="3rem" radius="var(--radius-md)" />
    </div>
  );
}

export function RecordSkeleton() {
  return (
    <div className="impact-dashboard skeleton-screen" aria-busy="true" aria-label="Loading your record">
      <p className="sr-only">Loading your record…</p>

      <section className="impact-hero" aria-hidden>
        <div className="impact-hero__copy">
          <Skeleton width="8rem" height="1.2rem" radius="var(--radius-sm)" />
          <SkeletonText lines={2} lastLineWidth="90%" className="skeleton--mt-sm" />
        </div>
        <Skeleton width="8.5rem" height="2.25rem" radius="var(--radius-md)" />
      </section>

      <div className="impact-stats" aria-hidden>
        <article className="impact-stat impact-stat--highlight">
          <Skeleton width="5rem" height="1.35rem" radius="var(--radius-sm)" />
          <Skeleton width="6rem" height="0.78rem" radius="var(--radius-sm)" />
        </article>
        {[0, 1, 2].map((index) => (
          <article key={index} className="impact-stat">
            <Skeleton width="4rem" height="1.35rem" radius="var(--radius-sm)" />
            <Skeleton width="5.5rem" height="0.78rem" radius="var(--radius-sm)" />
          </article>
        ))}
      </div>

      <section className="panel impact-global" aria-hidden>
        <Skeleton width="9rem" height="0.95rem" radius="var(--radius-sm)" />
        <SkeletonText lines={2} lastLineWidth="85%" className="skeleton--mt" />
        <Skeleton width="100%" height="0.55rem" radius="999px" className="skeleton--mt" />
        <SkeletonText lines={3} lastLineWidth="70%" className="skeleton--mt" />
      </section>

      <section className="panel" aria-hidden>
        <Skeleton width="10rem" height="0.95rem" radius="var(--radius-sm)" />
        <ul className="insight-list skeleton--mt">
          {[0, 1, 2].map((index) => (
            <li key={index} className="insight-card">
              <Skeleton width="72%" height="0.95rem" radius="var(--radius-sm)" />
              <SkeletonText lines={2} lastLineWidth="60%" className="skeleton--mt-sm" />
              <Skeleton width="5rem" height="0.72rem" radius="var(--radius-sm)" className="skeleton--mt-sm" />
            </li>
          ))}
        </ul>
      </section>

      <section className="panel" aria-hidden>
        <div className="panel__header">
          <Skeleton width="8rem" height="0.95rem" radius="var(--radius-sm)" />
          <Skeleton width="3.5rem" height="0.78rem" radius="var(--radius-sm)" />
        </div>
        <ul className="saved-gallery skeleton--mt">
          {[0, 1, 2].map((index) => (
            <li key={index} className="saved-gallery__card">
              <SkeletonCircle size="3rem" />
              <div className="saved-gallery__body">
                <Skeleton width="75%" height="0.9rem" radius="var(--radius-sm)" />
                <Skeleton width="90%" height="0.76rem" radius="var(--radius-sm)" className="skeleton--mt-xs" />
              </div>
              <Skeleton width="3rem" height="0.78rem" radius="var(--radius-sm)" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function RecipeSkeleton() {
  return (
    <section className="panel recipe-card skeleton-screen" aria-busy="true" aria-label="Setting the table">
      <p className="sr-only">Turning not-much into dinner…</p>

      <Skeleton width="70%" height="1.25rem" radius="var(--radius-sm)" aria-hidden />
      <SkeletonText lines={2} lastLineWidth="80%" className="skeleton--mt recipe-card__subtitle" aria-hidden />

      <div className="recipe-card__meta" aria-hidden>
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} width="3.5rem" height="0.82rem" radius="var(--radius-sm)" />
        ))}
      </div>

      <Skeleton width="100%" height="2.75rem" radius="var(--radius-md)" className="skeleton--mb" aria-hidden />

      <div className="recipe-columns" aria-hidden>
        <div>
          <Skeleton width="6rem" height="0.9rem" radius="var(--radius-sm)" />
          <SkeletonText lines={4} lastLineWidth="55%" className="skeleton--mt-sm" />
        </div>
        <div>
          <Skeleton width="6rem" height="0.9rem" radius="var(--radius-sm)" />
          <SkeletonText lines={3} lastLineWidth="60%" className="skeleton--mt-sm" />
        </div>
      </div>

      <Skeleton width="3.5rem" height="0.9rem" radius="var(--radius-sm)" aria-hidden />
      <SkeletonText lines={5} lastLineWidth="45%" className="skeleton--mt-sm" aria-hidden />
    </section>
  );
}
