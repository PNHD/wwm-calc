// The migration emits runtime template literals containing `${escaped}` into
// ocrGlobalEnglish.ts. Define the literal token for the migration module itself
// so its outer template string writes `${escaped}` verbatim instead of trying to
// resolve a migration-local variable.
globalThis.escaped = "${escaped}";
await import("./apply-t96-row-semantics.mjs");
