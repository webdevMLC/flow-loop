# Stage 1 — does it actually run?

The cheapest stage and the one most likely to find something, because nothing else asks it.

Every other gate in Flow runs inside a shell that an hour of work has already configured. This
stage asks what a stranger gets.

## Do it in this order

1. **Read the setup instructions as written** — README, a docs page, `.env.example`. Follow
   only those. Every step you have to invent is a finding: they will have to invent it too.
2. **Install.** From the lockfile, the way the instructions say.
3. **Bring up the dependencies** — the database, the queue, the cache. If the project ships a
   compose file, use it. If the instructions do not mention one and the app needs it, that is a
   finding.
4. **Migrate from empty.** Not from your existing database — an empty one. A migration chain
   that only works from the state you already have is not a migration chain.
5. **Build.** The production build, not the dev server. It catches a whole class of thing tests
   never see: server/client boundary violations, bad imports, route configuration, and
   environment read at module scope.
6. **Start it, and reach it.** Open the root URL. Then open one real page behind auth, and make
   one real request to one real endpoint. A process that is listening is not a system that works.
7. **Stop it, and remove what you started.** Containers you brought up are yours to take down.

## What counts as a finding here

**A step the instructions do not mention.** You set a variable, copied a file, changed a port,
ran a command not written down. Record the exact step. This is the commonest finding and the
one that costs a new person their first hour — and one real project failed at exactly this: the
environment file sat at the workspace root while the framework loaded it from the app
directory, so the suite passed and the app could not start.

**A step the instructions get wrong.** Worse than missing, because it is trusted.

**A default that is unsafe.** A missing variable that silently disables a control, rather than
refusing to start. Refusing to start is correct behaviour; note it as good and move on.

**Anything that only works because of state you already had.** A seeded row, a built cache, a
running container from last week. Those are the failures that reach a new machine and nobody
can reproduce.

## Record the environment, exactly

Versions of the runtime, the package manager, the database. The commands you ran. What you had
to set. The next person reproducing your report needs this more than they need your conclusions,
and a stage-1 finding is worthless if nobody can tell whether it was the project or the machine.

## Then stop, if it did not start

**If the system does not start, stage 2 and 3 do not run.** Report stage 1 alone. A data matrix
against a system that cannot serve a request is theatre, and a code review of an application
nobody can run is a reading exercise. Fix the start, then inspect.
