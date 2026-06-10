"use client";

import { memo, useMemo, type CSSProperties } from "react";
import type { PantryProfile } from "@/lib/coach/types";
import {
  formatPrice,
  formatSavingsPercent,
  generateNearbyDeals,
  type DealItem,
  type StoreDeal,
} from "@/lib/deals/mockDeals";
import { buildDealShare } from "@/lib/share/shareContent";
import { ShareButton } from "./ShareButton";

type StoreDealsSectionProps = {
  pantryProfile: PantryProfile;
};

function DealItemRow({ item, store }: { item: DealItem; store: StoreDeal }) {
  const savings = formatSavingsPercent(item.originalPrice, item.salePrice);

  return (
    <li className="deal-item">
      <div className="deal-item__main">
        <span className="deal-item__name">{item.ingredient}</span>
        <span className="deal-item__unit">{item.unit}</span>
      </div>
      <div className="deal-item__pricing">
        <span className="deal-item__was" aria-label={`Was ${formatPrice(item.originalPrice)}`}>
          {formatPrice(item.originalPrice)}
        </span>
        <span className="deal-item__now">{formatPrice(item.salePrice)}</span>
        <span className="deal-item__savings">Save {savings}%</span>
      </div>
      <div className="deal-item__footer">
        <span className={`deal-item__chip deal-item__chip--${item.matchReason}`}>
          {item.matchLabel}
        </span>
        <ShareButton content={buildDealShare(store, item)} compact label="Share deal" />
      </div>
    </li>
  );
}

function StoreCard({ store }: { store: StoreDeal }) {
  return (
    <article
      className="deal-store"
      style={{ "--deal-accent-hue": store.accentHue } as CSSProperties}
    >
      <header className="deal-store__header">
        <div className="deal-store__logo" aria-hidden>
          {store.logoInitial}
        </div>
        <div className="deal-store__meta">
          <h4 className="deal-store__name">{store.name}</h4>
          <span className="deal-store__distance">{store.distanceMiles} mi</span>
        </div>
      </header>
      <ul className="deal-store__items">
        {store.items.map((item) => (
          <DealItemRow key={`${store.id}-${item.ingredient}`} item={item} store={store} />
        ))}
      </ul>
    </article>
  );
}

export const StoreDealsSection = memo(function StoreDealsSection({ pantryProfile }: StoreDealsSectionProps) {
  const deals = useMemo(
    () => generateNearbyDeals(pantryProfile),
    [pantryProfile],
  );

  return (
    <section className="deals-section" aria-labelledby="deals-heading">
      <header className="deals-section__header">
        <p className="deals-section__eyebrow">Near you</p>
        <h3 id="deals-heading">Neighborhood deals</h3>
        <p className="deals-section__intro">
          Neighborhood provisions picked for your pantry — not every aisle, just what
          matters to you.
        </p>
      </header>

      <div className="deals-section__scroll" role="list">
        {deals.stores.map((store) => (
          <StoreCard key={store.id} store={store} />
        ))}
      </div>

      <p className="deals-section__footnote">
        Curated from partner markets in your area
      </p>
    </section>
  );
});
