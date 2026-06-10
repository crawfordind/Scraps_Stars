import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";



export const users = sqliteTable("users", {

  id: text("id").primaryKey(),

  name: text("name").notNull(),

  xp: integer("xp").default(0).notNull(),

  level: integer("level").default(1).notNull(),

  streakDays: integer("streak_days").default(0).notNull(),

  adventureRating: integer("adventure_rating").default(5).notNull(),

  selectedChefId: text("selected_chef_id").default("bottura"),

  handle: text("handle"),

  avatarEmoji: text("avatar_emoji"),

  authToken: text("auth_token"),

  email: text("email"),

  authProvider: text("auth_provider").$type<"anonymous" | "magic_link">(),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),

}, (table) => ({

  handleUnique: uniqueIndex("users_handle_unique").on(table.handle),

  authTokenUnique: uniqueIndex("users_auth_token_unique").on(table.authToken),

}));



export const savedRecipes = sqliteTable("saved_recipes", {

  id: text("id").primaryKey(),

  userId: text("user_id")

    .references(() => users.id)

    .notNull(),

  shareId: text("share_id").notNull(),

  recipeName: text("recipe_name").notNull(),

  recipeJson: text("recipe_json").notNull(),

  chefId: text("chef_id").notNull(),

  tier: integer("tier").notNull(),

  inventorySnapshot: text("inventory_snapshot"),

  liked: integer("liked", { mode: "boolean" }).default(true).notNull(),

  platedPhotoUrl: text("plated_photo_url"),

  nailedIt: integer("nailed_it", { mode: "boolean" }),

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),

}, (table) => ({

  shareIdUnique: uniqueIndex("saved_recipes_share_id_unique").on(table.shareId),

  shareIdIdx: index("saved_recipes_share_id_idx").on(table.shareId),

}));



export const cookSessions = sqliteTable("cook_sessions", {

  id: text("id").primaryKey(),

  recipeId: text("recipe_id")

    .references(() => savedRecipes.id)

    .notNull(),

  userId: text("user_id")

    .references(() => users.id)

    .notNull(),

  stepIndex: integer("step_index").default(0).notNull(),

  completedSteps: text("completed_steps").notNull(),

  timers: text("timers").notNull(),

  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),

  status: text("status").notNull(),

  verdict: text("verdict"),

});



export const challenges = sqliteTable("challenges", {

  id: text("id").primaryKey(),

  theme: text("theme").notNull(),

  prompt: text("prompt").notNull(),

  constraints: text("constraints").notNull(),

  startsAt: integer("starts_at", { mode: "timestamp" }).notNull(),

  endsAt: integer("ends_at", { mode: "timestamp" }).notNull(),

});



export const challengeEntries = sqliteTable(

  "challenge_entries",

  {

    id: text("id").primaryKey(),

    userId: text("user_id")

      .references(() => users.id)

      .notNull(),

    challengeId: text("challenge_id")

      .references(() => challenges.id)

      .notNull(),

    recipeId: text("recipe_id")

      .references(() => savedRecipes.id)

      .notNull(),

    score: integer("score").notNull(),

    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),

  },

  (table) => ({

    userChallengeUnique: uniqueIndex("challenge_entries_user_challenge_unique").on(

      table.userId,

      table.challengeId,

    ),

  }),

);



export const inventory = sqliteTable("inventory", {

  id: text("id").primaryKey(),

  userId: text("user_id")

    .references(() => users.id)

    .notNull(),

  ingredientName: text("ingredient_name").notNull(),

  quantity: text("quantity"),

  isSpice: integer("is_spice", { mode: "boolean" }).default(false).notNull(),

  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),

});



export const userCoachContext = sqliteTable("user_coach_context", {

  userId: text("user_id")

    .primaryKey()

    .references(() => users.id),

  briefingJson: text("briefing_json").notNull(),

  pantryProfileJson: text("pantry_profile_json"),

  foodSecurityScore: integer("food_security_score").default(50).notNull(),

  generatedAt: integer("generated_at", { mode: "timestamp" }).notNull(),

  triggerEvent: text("trigger_event").notNull(),

});



export const userPreferences = sqliteTable(

  "user_preferences",

  {

    id: text("id").primaryKey(),

    userId: text("user_id")

      .references(() => users.id)

      .notNull(),

    preferenceKey: text("preference_key").notNull(),

    serializedValues: text("serialized_values").notNull(),

  },

  (table) => ({

    userPrefUnique: uniqueIndex("user_pref_unique").on(table.userId, table.preferenceKey),

  }),

);


