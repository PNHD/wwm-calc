/**
 * Speedrun-guide team modifiers. These are expected-value estimates only; the
 * verified per-hit damage formula remains in calc.ts.
 */
export function applyTeamModifiers(members, { vulnerability, revelryUptime }) {
  const uptime = Math.min(1, Math.max(0, Number(revelryUptime) || 0));
  const adjusted = members.map((member) => {
    const vulnerabilityBonus = vulnerability ? (member.buildKey === "stonesplit-might" ? 0.16 : 0.08) : 0;
    const modifier = 1 + vulnerabilityBonus + 0.20 * uptime;
    return { ...member, modifier, adjustedDps: member.dps * modifier };
  });
  return { members: adjusted, total: adjusted.reduce((sum, member) => sum + member.adjustedDps, 0) };
}

export function qiBreakBonus(buildKeys, poisonDivinecraft) {
  return (buildKeys.includes("bamboocut-dust") ? 5 : 0)
    + (buildKeys.includes("bellstrike-splendor") ? 10 : 0)
    + (poisonDivinecraft ? 5 : 0);
}
