"use client";

import { useCallback, useEffect, useState } from "react";
import type { LlmRequestMeta, RecipeOutput, Tier } from "@/lib/llm/types";
import { compressImageFile } from "@/lib/images/compressClient";
import { formatCostUsd } from "@/lib/telemetry/costEstimator";
import { ImageCapture } from "./ImageCapture";

type ExtractedIngredient = {
  ingredientName: string;
  quantity?: string;
  isSpice: boolean;
};

type ApiMeta = LlmRequestMeta;

const TIER_OPTIONS: Array<{ tier: Tier; label: string; description: string }> = [
  { tier: 1, label: "Strictly Here", description: "Zero grocery cost — pantry only" },
  { tier: 2, label: "Bridge the Gap", description: "1–3 high-impact extras" },
  { tier: 3, label: "Full Feast", description: "Complete meal + shopping list" },
];

export function KitchenScanner() {
  const [scanning, setScanning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<ExtractedIngredient[]>([]);
  const [tier, setTier] = useState<Tier>(1);
  const [recipe, setRecipe] = useState<RecipeOutput | null>(null);
  const [scanMeta, setScanMeta] = useState<ApiMeta | null>(null);
  const [recipeMeta, setRecipeMeta] = useState<ApiMeta | null>(null);
  const [step, setStep] = useState<"capture" | "inventory" | "recipe" | "done">("capture");

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setRecipe(null);
    setRecipeMeta(null);
    setScanMeta(null);
    setScanning(true);
    setStep("capture");

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

      setIngredients(extractJson.data.ingredients);
      setScanMeta(extractJson.meta);
      setStep(extractJson.data.ingredients.length > 0 ? "inventory" : "capture");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
      setIngredients([]);
      setStep("capture");
    } finally {
      setScanning(false);
    }
  }, []);

  const generateRecipe = async () => {
    if (ingredients.length === 0) return;

    setGenerating(true);
    setError(null);
    setStep("recipe");

    try {
      const res = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryList: ingredients.map((i) => i.ingredientName),
          preferences: [],
          tier,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Recipe generation failed");

      setRecipe(json.data);
      setRecipeMeta(json.meta);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recipe generation failed");
      setStep("inventory");
    } finally {
      setGenerating(false);
    }
  };

  const resetScan = () => {
    setIngredients([]);
    setRecipe(null);
    setScanMeta(null);
    setRecipeMeta(null);
    setError(null);
    setStep("capture");
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const totalCycleCost = (scanMeta?.estimatedCostUsd ?? 0) + (recipeMeta?.estimatedCostUsd ?? 0);

  return (
    <div className="scanner">
      <nav className="stepper" aria-label="Progress">
        {(["capture", "inventory", "recipe", "done"] as const).map((s, i) => (
          <span key={s} className={`stepper__step ${step === s || (step === "done" && s === "recipe") ? "stepper__step--active" : ""} ${(["capture", "inventory", "recipe", "done"].indexOf(step) > i) ? "stepper__step--done" : ""}`}>
            {i + 1}. {s === "capture" ? "Scan" : s === "inventory" ? "Inventory" : s === "recipe" ? "Recipe" : "Done"}
          </span>
        ))}
      </nav>

      <ImageCapture
        onCapture={(file) => void processFile(file)}
        disabled={scanning || generating}
        previewUrl={imagePreview}
        scanning={scanning}
      />

      {ingredients.length > 0 && (
        <section className="panel">
          <div className="panel__header">
            <h2>Detected Inventory</h2>
            <button type="button" className="panel__link" onClick={resetScan}>
              New scan
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
          {scanMeta && (
            <p className="meta">
              Scan: {scanMeta.latencyMs}ms · {scanMeta.model} · {formatCostUsd(scanMeta.estimatedCostUsd)}
            </p>
          )}
        </section>
      )}

      {ingredients.length > 0 && (
        <section className="panel">
          <h2>Recipe Tier</h2>
          <div className="tier-toggle">
            {TIER_OPTIONS.map((option) => (
              <button
                key={option.tier}
                type="button"
                className={`tier-btn ${tier === option.tier ? "tier-btn--active" : ""}`}
                onClick={() => setTier(option.tier)}
              >
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="primary-btn"
            disabled={generating}
            onClick={() => void generateRecipe()}
          >
            {generating ? "Generating recipe…" : "Generate Recipe"}
          </button>
        </section>
      )}

      {recipe && (
        <section className="panel recipe-card">
          <h2>{recipe.recipe_name}</h2>
          <p className="recipe-card__subtitle">{recipe.flavor_profile_explanation}</p>
          <div className="recipe-card__meta">
            <span>{recipe.estimated_time_minutes} min</span>
            <span>{recipe.difficulty}</span>
            <span>+{recipe.xp_reward} XP</span>
          </div>

          <div className="recipe-columns">
            <div>
              <h3>From Your Pantry</h3>
              <ul>
                {recipe.ingredients_pantry.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            {recipe.ingredients_shopping_list.length > 0 && (
              <div>
                <h3>Shopping List</h3>
                <ul>
                  {recipe.ingredients_shopping_list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <h3>Steps</h3>
          <ol>
            {recipe.steps.map((stepText) => (
              <li key={stepText}>{stepText}</li>
            ))}
          </ol>

          {recipeMeta && (
            <p className="meta">
              Recipe: {recipeMeta.latencyMs}ms · {recipeMeta.model} · {formatCostUsd(recipeMeta.estimatedCostUsd)}
            </p>
          )}
        </section>
      )}

      {(scanMeta || recipeMeta) && (
        <p className="cycle-cost">
          Full cycle estimate: <strong>{formatCostUsd(totalCycleCost)}</strong>
          {totalCycleCost < 0.005 && " — under $0.005 target"}
        </p>
      )}

      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}
