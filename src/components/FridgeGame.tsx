"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CHEF_PERSONAS, getChefById, getChefReaction } from "@/lib/chefs/personas";
import { phaseToTurn, type GamePhase } from "@/lib/game/turns";
import type { LlmRequestMeta, RecipeOutput, Tier } from "@/lib/llm/types";
import type { RecommendationResult } from "@/lib/recommendations/engine";
import { compressImageFile } from "@/lib/images/compressClient";
import { formatCostUsd } from "@/lib/telemetry/costEstimator";
import {
  fetchCoachHome,
  fetchRecommendations,
  fetchSavedRecipes,
  fetchUser,
  invalidateAfterRecipeChange,
  invalidateAfterUserChange,
  invalidateUser,
  refreshCoachBriefing,
  type SavedRecipeItem,
} from "@/lib/api/fetchers";
import { ChefPicker } from "./ChefPicker";
import { ChefSpeech } from "./ChefSpeech";
import { GameHUD } from "./GameHUD";
import { ImageCapture } from "./ImageCapture";
import { buildRecipeShare } from "@/lib/share/shareContent";
import { SavedRecipesPanel } from "./SavedRecipesPanel";
import { PrescriptionShareButton } from "./PrescriptionShareButton";
import { ShareButton } from "./ShareButton";
import Link from "next/link";
import { RecipeSkeleton } from "./Skeleton";
import { cookRecipePath } from "@/lib/challenge/activeChallenge";
import { FadeIn, MotionLink, SpringButton } from "@/components/motion/ui";
import { useToast } from "@/components/feedback/ToastProvider";

type ExtractedIngredient = {
  ingredientName: string;
  quantity?: string;
  isSpice: boolean;
};

const TIER_OPTIONS: Array<{ tier: Tier; label: string; description: string }> = [
  { tier: 1, label: "Strictly Here", description: "Zero grocery cost — pantry only" },
  { tier: 2, label: "Bridge the Gap", description: "1–3 high-impact extras" },
  { tier: 3, label: "Full Feast", description: "Complete meal + shopping list" },
];

type FridgeGameProps = {
  onOpenKitchen?: () => void;
  onCoachUpdated?: () => void;
  activeChallengeId?: string | null;
};

export function FridgeGame({ onOpenKitchen, onCoachUpdated, activeChallengeId }: FridgeGameProps) {
  const [phase, setPhase] = useState<GamePhase>("choose-chef");
  const [scanning, setScanning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<ExtractedIngredient[]>([]);
  const [tier, setTier] = useState<Tier>(1);
  const [recipe, setRecipe] = useState<RecipeOutput | null>(null);
  const [scanMeta, setScanMeta] = useState<LlmRequestMeta | null>(null);
  const [recipeMeta, setRecipeMeta] = useState<LlmRequestMeta | null>(null);
  const [selectedChefId, setSelectedChefId] = useState("bottura");
  const [chefSpeech, setChefSpeech] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipeItem[]>([]);
  const [savedOpen, setSavedOpen] = useState(false);
  const [recipeSaved, setRecipeSaved] = useState(false);
  const [savedShareId, setSavedShareId] = useState<string | null>(null);
  const [savedRecipeId, setSavedRecipeId] = useState<string | null>(null);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [levelUpFlash, setLevelUpFlash] = useState(false);
  const [coachGreeting, setCoachGreeting] = useState<string | null>(null);
  // Optimization telemetry (model, latency, per-call cost) is for us, not the
  // home cook — it clutters the result and undercuts the premium feel. Hidden
  // by default; opt in with ?debug or NEXT_PUBLIC_SHOW_TELEMETRY=true.
  const [showTelemetry, setShowTelemetry] = useState(false);
  const chefChoiceLocked = useRef(false);

  const { showToast } = useToast();

  const chef = getChefById(selectedChefId) ?? CHEF_PERSONAS[0];
  const currentTurn = phaseToTurn(phase === "verdict" ? "create" : phase);

  const loadUser = useCallback(async () => {
    const user = await fetchUser();
    setXp(user.xp);
    setLevel(user.level);
    if (!chefChoiceLocked.current && user.selectedChefId) {
      setSelectedChefId(user.selectedChefId);
    }
    // Time-to-magic: returning cooks (any prior XP) already have a chef and
    // know the ritual. Drop them straight at the fridge instead of re-running
    // Turn 1 every session. First-timers (xp 0) still get the chef picker.
    if (user.xp > 0 && !chefChoiceLocked.current) {
      setPhase((p) => (p === "choose-chef" ? "scout" : p));
    }
  }, []);

  const loadSavedRecipes = useCallback(async () => {
    const recipes = await fetchSavedRecipes();
    setSavedRecipes(recipes);
  }, []);

  const loadRecommendations = useCallback(async (inventory: string[], chefId: string) => {
    const result = await fetchRecommendations(inventory, chefId);
    setRecommendations(result);
  }, []);

  useEffect(() => {
    void loadUser();

    const deferSecondary = () => {
      void loadSavedRecipes();
      void loadRecommendations([], selectedChefId);
      void fetchCoachHome().then((data) => {
        setCoachGreeting(data.coach.briefing.greeting);
      });
    };

    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(deferSecondary, { timeout: 1500 });
      return () => cancelIdleCallback(id);
    }
    const timer = window.setTimeout(deferSecondary, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only bootstrap
  }, [loadUser, loadSavedRecipes, loadRecommendations]);

  useEffect(() => {
    if (activeChallengeId) setTier(1);
  }, [activeChallengeId]);

  useEffect(() => {
    const debug = new URLSearchParams(window.location.search).has("debug");
    setShowTelemetry(debug || process.env.NEXT_PUBLIC_SHOW_TELEMETRY === "true");
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const selectChef = async (chefId: string) => {
    chefChoiceLocked.current = true;
    setSelectedChefId(chefId);
    const picked = getChefById(chefId);
    if (picked) {
      setChefSpeech(`${picked.tagline} Ready when you are — let's see what's in your fridge.`);
    }
    await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedChefId: chefId }),
    });
    invalidateAfterUserChange();
    setPhase("scout");
  };

  const processFile = useCallback(
    async (file: File) => {
      setRecipe(null);
      setRecipeMeta(null);
      setScanMeta(null);
      setRecipeSaved(false);
      setScanning(true);

      const compressed = await compressImageFile(file);
      const previewUrl = URL.createObjectURL(compressed);
      setImagePreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return previewUrl;
      });

      try {
        const formData = new FormData();
        formData.append("file", compressed);

        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadJson = await uploadRes.json();
        if (!uploadJson.ok) throw new Error(uploadJson.error ?? "Upload failed");

        const extractRes = await fetch("/api/inventory/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: uploadJson.data.imageUrl }),
        });
        const extractJson = await extractRes.json();
        if (!extractJson.ok) throw new Error(extractJson.error ?? "Extraction failed");

        const found = extractJson.data.ingredients as ExtractedIngredient[];
        const confidence =
          typeof extractJson.data.confidence === "number" ? extractJson.data.confidence : null;
        setIngredients(found);
        setScanMeta(extractJson.meta);

        const activeChef = getChefById(selectedChefId) ?? CHEF_PERSONAS[0];

        if (found.length === 0) {
          // Agentic dead-end → actionable guidance. Stay on the scan step so a
          // retake is one tap away instead of a silent stall.
          setChefSpeech(
            `${activeChef.name} couldn't spot any food in that shot. Try again with more light, or get the open shelves in frame.`,
          );
          showToast({
            message: "No ingredients spotted — try a brighter, closer photo of the open fridge or pantry.",
          });
          setPhase("scout");
          return;
        }

        const reaction = getChefReaction(activeChef, found.length);
        setChefSpeech(
          confidence !== null && confidence < 0.4
            ? `${reaction} A couple items were hard to read — tap Re-scan if I missed anything.`
            : reaction,
        );
        await loadRecommendations(found.map((i) => i.ingredientName), selectedChefId);
        setPhase("consult");
      } catch (err) {
        showToast({
          message: err instanceof Error ? err.message : "Scan failed",
          tone: "error",
        });
        setIngredients([]);
      } finally {
        setScanning(false);
      }
    },
    [selectedChefId, loadRecommendations, showToast],
  );

  const advanceToStrategy = () => {
    const activeChef = getChefById(selectedChefId) ?? CHEF_PERSONAS[0];
    const recTier = recommendations?.suggestedTier ?? tier;
    setTier(recTier);
    setChefSpeech(
      recommendations
        ? `${recommendations.reason} I'd suggest ${TIER_OPTIONS.find((t) => t.tier === recTier)?.label ?? "Strictly Here"}. ${activeChef.tierAdvice[recTier]}`
        : activeChef.tierAdvice[tier],
    );
    setPhase("strategy");
  };

  const generateRecipe = async () => {
    if (ingredients.length === 0) return;

    setGenerating(true);
    setPhase("create");

    try {
      const res = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryList: ingredients.map((i) => i.ingredientName),
          preferences: recommendations?.excludeIngredients ?? [],
          tier,
          chefId: selectedChefId,
          flavorHints: recommendations?.flavorHints ?? [],
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Recipe generation failed");

      const data = json.data as RecipeOutput;
      setRecipe(data);
      setRecipeMeta(json.meta);
      setChefSpeech(data.chef_commentary ?? "From that? Yeah. From that.");
      setPhase("verdict");
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : "Recipe generation failed",
        tone: "error",
      });
      setPhase("strategy");
    } finally {
      setGenerating(false);
    }
  };

  const saveRecipe = async () => {
    if (!recipe || recipeSaved) return;
    setSaving(true);
    try {
      const res = await fetch("/api/recipes/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe,
          chefId: selectedChefId,
          tier,
          inventorySnapshot: ingredients.map((i) => i.ingredientName),
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Save failed");

      setSavedShareId(json.data.shareId as string);
      setSavedRecipeId(json.data.id as string);

      const xpRes = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awardXp: recipe.xp_reward }),
      });
      const xpJson = await xpRes.json();
      invalidateUser();
      if (xpJson.ok) {
        setXp(xpJson.data.xp);
        setLevel(xpJson.data.level);
        if (xpJson.data.xpResult?.leveledUp) {
          setLevelUpFlash(true);
          setTimeout(() => setLevelUpFlash(false), 3000);
          void refreshCoachBriefing("level_up").then(() => onCoachUpdated?.());
        }
      }

      setRecipeSaved(true);
      invalidateAfterRecipeChange();
      await loadSavedRecipes();
      void refreshCoachBriefing("recipe_saved").then(() => onCoachUpdated?.());
      setChefSpeech("Banked. Another feast from nothing — check Larder for your updated score.");
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : "Failed to save recipe",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const commitDelete = useCallback(
    async (id: string) => {
      await fetch("/api/recipes/saved", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      invalidateAfterRecipeChange();
      await loadSavedRecipes();
      await loadRecommendations(ingredients.map((i) => i.ingredientName), selectedChefId);
    },
    [ingredients, selectedChefId, loadSavedRecipes, loadRecommendations],
  );

  // User-Centricity: deletes are recoverable. We optimistically remove the
  // recipe from the list and offer Undo; the server delete only fires if the
  // user lets the toast expire without taking it back.
  const deleteSavedRecipe = (id: string) => {
    const index = savedRecipes.findIndex((r) => r.id === id);
    if (index === -1) return;
    const removed = savedRecipes[index];

    setSavedRecipes((prev) => prev.filter((r) => r.id !== id));

    showToast({
      message: `Removed “${removed.recipeName}”`,
      action: {
        label: "Undo",
        onClick: () => {
          setSavedRecipes((prev) => {
            if (prev.some((r) => r.id === removed.id)) return prev;
            const next = [...prev];
            next.splice(Math.min(index, next.length), 0, removed);
            return next;
          });
        },
      },
      onExpire: () => {
        void commitDelete(removed.id);
      },
    });
  };

  const newRound = () => {
    chefChoiceLocked.current = false;
    setIngredients([]);
    setRecipe(null);
    setScanMeta(null);
    setRecipeMeta(null);
    setRecipeSaved(false);
    setRecommendations(null);
    setChefSpeech(`${chef.tagline} New round — show me the fridge, or swap your coach above.`);
    setPhase("scout");
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    void loadRecommendations([], selectedChefId);
  };

  const totalCycleCost = (scanMeta?.estimatedCostUsd ?? 0) + (recipeMeta?.estimatedCostUsd ?? 0);

  return (
    <div className="fridge-game">
      <GameHUD currentTurn={currentTurn} xp={xp} level={level} chef={chef} />

      {levelUpFlash && (
        <div className="level-up-toast" role="status">
          Level up! You&apos;re now Level {level}
        </div>
      )}

      <div className="game-toolbar">
        {onOpenKitchen && (
          <button type="button" className="toolbar-btn" onClick={onOpenKitchen}>
            Your table
          </button>
        )}
        <button type="button" className="toolbar-btn" onClick={() => setSavedOpen(true)}>
          Quick saves ({savedRecipes.length})
        </button>
        {phase !== "choose-chef" && (
          <button type="button" className="toolbar-btn toolbar-btn--ghost" onClick={newRound}>
            New round
          </button>
        )}
      </div>

      {activeChallengeId && (
        <FadeIn className="challenge-cook-banner panel">
          <p>
            <strong>Challenge mode:</strong> save a Tier 1 recipe, then tap <strong>Cook this</strong> and finish with{" "}
            <strong>Nailed It</strong> to join the leaderboard.
          </p>
        </FadeIn>
      )}

      {(chefSpeech || coachGreeting) && (
        <ChefSpeech
          chef={chef}
          message={chefSpeech ?? coachGreeting ?? ""}
          label={chefSpeech ? "The host says" : "Your host"}
        />
      )}

      {phase === "choose-chef" && (
        <section className="panel">
          <h2>Turn 1 — Pick Your Chef</h2>
          <p className="panel__intro">
            World-class mentors compete for your fridge. Each brings a unique zero-waste philosophy.
          </p>
          {recommendations && (
            <p className="recommendation-hint">{recommendations.reason}</p>
          )}
          <ChefPicker
            chefs={CHEF_PERSONAS}
            selectedId={selectedChefId}
            suggestedId={recommendations?.suggestedChefId}
            onSelect={(id) => void selectChef(id)}
          />
        </section>
      )}

      {(phase === "scout" || (phase === "consult" && ingredients.length === 0)) && (
        <section className="panel">
          <div className="panel__header">
            <h2>Turn 2 — Open the fridge</h2>
            <button type="button" className="panel__link" onClick={() => setPhase("choose-chef")}>
              Cooking with {chef.name} — change
            </button>
          </div>
          <p className="panel__intro">
            Looks bare? Perfect. Show me the sad shelf — {chef.name} is already raising an eyebrow.
          </p>
          <ImageCapture
            onCapture={(file) => void processFile(file)}
            disabled={scanning || generating}
            previewUrl={imagePreview}
            scanning={scanning}
          />
        </section>
      )}

      {phase === "consult" && ingredients.length > 0 && (
        <section className="panel">
          <div className="panel__header">
            <h2>Turn 3 — Chef Consult</h2>
            <button type="button" className="panel__link" onClick={() => setPhase("scout")}>
              Re-scan
            </button>
          </div>
          <ul className="chip-list">
            {ingredients.map((item, index) => (
              <li key={`${item.ingredientName}-${index}`} className="chip">
                {item.ingredientName}
                {item.isSpice && <span className="chip__tag">spice</span>}
              </li>
            ))}
          </ul>
          {showTelemetry && scanMeta && (
            <p className="meta">
              Scan: {scanMeta.latencyMs}ms · {scanMeta.model} · {formatCostUsd(scanMeta.estimatedCostUsd)}
            </p>
          )}
          <SpringButton type="button" className="primary-btn" onClick={advanceToStrategy}>
            Hear {chef.name}&apos;s plan →
          </SpringButton>
        </section>
      )}

      {phase === "strategy" && ingredients.length > 0 && (
        <section className="panel">
          <h2>Turn 4 — Set Strategy</h2>
          {recommendations && (
            <p className="recommendation-hint">Tip: {recommendations.reason}</p>
          )}
          <div className="tier-toggle">
            {TIER_OPTIONS.map((option) => (
              <button
                key={option.tier}
                type="button"
                className={`tier-btn ${tier === option.tier ? "tier-btn--active" : ""} ${recommendations?.suggestedTier === option.tier ? "tier-btn--suggested" : ""}`}
                onClick={() => {
                  setTier(option.tier);
                  setChefSpeech(chef.tierAdvice[option.tier]);
                }}
              >
                <strong>{option.label}</strong>
                <span>{option.description}</span>
                {recommendations?.suggestedTier === option.tier && (
                  <span className="tier-btn__badge">Recommended</span>
                )}
              </button>
            ))}
          </div>
          <button type="button" className="primary-btn" disabled={generating} onClick={() => void generateRecipe()}>
            {generating ? "Setting the table…" : "Turn not-much into dinner →"}
          </button>
        </section>
      )}

      {(phase === "create" || phase === "verdict") && recipe && (
        <section className="panel panel--feast recipe-card">
          <p className="stamp-label recipe-card__reveal">Told you. Feast.</p>
          <h2>{recipe.recipe_name}</h2>
          <p className="recipe-card__subtitle">{recipe.flavor_profile_explanation}</p>
          <div className="recipe-card__meta">
            <span>{recipe.estimated_time_minutes} min</span>
            <span>{recipe.difficulty}</span>
            <span>+{recipe.xp_reward} XP</span>
            <span>{chef.name}</span>
          </div>

          {recipe.chef_waste_tip && (
            <div className="waste-tip">
              <strong>Zero-waste tip:</strong> {recipe.chef_waste_tip}
            </div>
          )}

          <div className="recipe-columns">
            <div>
              <h3>From Your Pantry</h3>
              <ul>
                {recipe.ingredients_pantry.map((item, index) => (
                  <li key={`pantry-${index}-${item}`}>{item}</li>
                ))}
              </ul>
            </div>
            {recipe.ingredients_shopping_list.length > 0 && (
              <div>
                <h3>Shopping List</h3>
                <ul>
                  {recipe.ingredients_shopping_list.map((item, index) => (
                    <li key={`shop-${index}-${item}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <h3>Steps</h3>
          <ol>
            {recipe.steps.map((stepText, index) => (
              <li key={`step-${index}`}>{stepText}</li>
            ))}
          </ol>

          {showTelemetry && recipeMeta && (
            <p className="meta">
              Recipe: {recipeMeta.latencyMs}ms · {recipeMeta.model} · {formatCostUsd(recipeMeta.estimatedCostUsd)}
            </p>
          )}

          {phase === "verdict" && (
            <div className="verdict-actions">
              <SpringButton
                type="button"
                className="primary-btn"
                disabled={saving || recipeSaved}
                onClick={() => void saveRecipe()}
              >
                {recipeSaved ? "Banked." : saving ? "Saving…" : `Save this feast · +${recipe.xp_reward} XP`}
              </SpringButton>
              {recipeSaved && savedShareId && (
                <>
                  <PrescriptionShareButton
                    shareId={savedShareId}
                    content={buildRecipeShare(recipe, chef.name, tier)}
                    label="Share recipe card"
                  />
                  {savedRecipeId && (
                    <MotionLink href={cookRecipePath(savedRecipeId, activeChallengeId)} className="secondary-btn">
                      Cook this
                    </MotionLink>
                  )}
                </>
              )}
              {!recipeSaved && (
                <ShareButton content={buildRecipeShare(recipe, chef.name, tier)} label="Share text" />
              )}
              <button type="button" className="secondary-btn" onClick={newRound}>
                Play another round
              </button>
            </div>
          )}
        </section>
      )}

      {phase === "create" && generating && !recipe && <RecipeSkeleton />}

      {showTelemetry && (scanMeta || recipeMeta) && (
        <p className="cycle-cost">
          Full cycle estimate: <strong>{formatCostUsd(totalCycleCost)}</strong>
          {totalCycleCost < 0.005 && " — under $0.005 target"}
        </p>
      )}

      <SavedRecipesPanel
        recipes={savedRecipes}
        open={savedOpen}
        onClose={() => setSavedOpen(false)}
        onDelete={(id) => void deleteSavedRecipe(id)}
      />
    </div>
  );
}
