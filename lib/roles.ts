export const accountRoles = ["user", "support", "admin", "banned"] as const;

export type AccountRole = (typeof accountRoles)[number];

const abilityRank = {
  user: 1,
  support: 2,
  admin: 3,
} as const;

export type AccountAbility = keyof typeof abilityRank;

export function hasAbility(role: AccountRole, ability: AccountAbility): boolean {
  if (role === "banned") {
    return false;
  }
  return abilityRank[role] >= abilityRank[ability];
}
