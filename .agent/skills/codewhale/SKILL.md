---
name: codewhale
description: Delegate heavy coding, debugging, multi-file refactors, parallel codebase exploration, shell commands, git ops, and web research to CodeWhale (DeepSeek V4 Pro, ~$0.43/M input tokens). Use when a task needs a full autonomous agent loop with Read/Write/Shell/Search tools, or when you want parallel sub-agents for independent investigations.
---

# CodeWhale

Autonomous coding agent backed by DeepSeek V4 Pro. Runs in its own sandbox with Read, Write, Edit, Shell, Git, Grep, Web Search, Sub-agent, and RLM tools.

## When to Activate

- Multi-file refactors or feature implementation
- Complex debugging sessions needing shell/git access
- Parallel codebase exploration (grep across many files, read many files)
- Web research or URL fetching
- Any task where you want a second agent to work independently and return results

## Do NOT Activate

- Single-line fixes or trivial one-file edits
- Questions answerable without code changes
- Tasks already handled well by your built-in tools

## Instructions

1. Receive the user's task
2. Call CodeWhale via its API/CLI with the full task context
3. Wait for results and relay them to the user
4. Do not modify CodeWhale's output unless asked

## Integration

CodeWhale is available as an MCP server (see `../.agent/mcp.json`) or via CLI:
```bash
codewhale run "<task>" --workspace .
```

## Safety

- CodeWhale runs in its own sandbox with separate permissions
- Always verify file changes after CodeWhale completes
- Never include secrets or API keys in prompts sent to CodeWhale
