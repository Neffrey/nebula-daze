// LIBS
import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { type AdapterAccount } from "next-auth/adapters";

// UTILS
import { type InferSqlTable, type PrettyType } from "~/lib/type-utils";

// CONSTS
export const COLOR_THEMES = [
  "bland",
  "bumblebee",
  "coffee",
  "cupcake",
  "forest",
  "galaxy",
  "lavender",
  "valentine",
] as const;
export type ColorTheme = (typeof COLOR_THEMES)[number];

export const LD_THEMES = ["system", "light", "dark"] as const;
export type LdTheme = (typeof LD_THEMES)[number];

export const USER_ROLES = ["ADMIN", "USER", "RESTRICTED"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `ndaze_${name}`);

// USER TABLES
export type DbUser = PrettyType<
  InferSqlTable<typeof users> & {
    accounts?: Account[];
    profilePictures?: ProfilePicture[];
  }
>;
export const users = createTable("user", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("email_verified", {
    mode: "date",
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP`),
  image: varchar("image", { length: 255 }),
  role: text("role", { enum: USER_ROLES }).default(USER_ROLES[1]),
  colorTheme: text("colorTheme", { enum: COLOR_THEMES }).default(
    COLOR_THEMES[5],
  ),
  ldTheme: text("ldTheme", { enum: LD_THEMES }).default(LD_THEMES[1]),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export type Account = PrettyType<InferSqlTable<typeof accounts>>;
export const accounts = createTable(
  "account",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  {
    sessionToken: varchar("session_token", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_user_id_idx").on(session.userId),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

// CUSTOM ACCOUNT TABLES

export type ProfilePicture = PrettyType<
  InferSqlTable<typeof profilePictures> & {
    user?: DbUser[];
  }
>;
export const profilePictures = createTable(
  "profilePicture",
  {
    id: text("id")
      .notNull()
      .primaryKey()
      .$default(() => nanoid(12)),
    user: text("user")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    createdAt: timestamp("createdAt", {
      mode: "date",
    }).default(sql`CURRENT_TIMESTAMP`),
  },
  (profilePicture) => ({
    idIndex: index("pp_id_Index").on(profilePicture.id),
  }),
);
