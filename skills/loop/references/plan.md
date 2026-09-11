# PLAN is its own command

The PLAN stage lives at `skills/plan/SKILL.md` and is invoked as **`/flow:plan`**.

**On Claude Code, invoke it.** Do not read it from here and run it inline — it spawns five
concurrent experts and publishes an artifact, and it is written to be the whole turn.

**On a host that cannot invoke commands** (anything reading `AGENTS.md`), read
`skills/plan/SKILL.md` and `skills/plan/references/artifact.md` directly and follow them.

It runs at a new project's first Full task, when adopting an existing codebase, at a milestone
or module boundary, or when the owner says the result is not what they wanted. Never per
phase. The plan gate denies source writes until it has run and the owner has confirmed its
output, so nothing here needs to persuade you to run it.
