# WWM Build Lab Agent Rules

## Collaboration

- Keep subagent prompts short and independent.
- Use `fork_turns: "none"` by default; fork context only when the task genuinely requires it.
- Limit concurrent subagents so browser, build, and deploy checks remain observable.
- Every subagent result must include files changed, checks run, and unresolved risks.

## Product Scope

- Preserve the verified WWM damage formulas and Global T91/T96 assumptions.
- Do not invent conditional Inner Way effects; mark uncertain effects for in-game verification.
- Reuse existing engines and data before adding new abstractions.
