---
title: "Product Brief: To-Do-List"
status: done
created: 2026-09-08
updated: 2026-09-10
---

# Product Brief: To-Do-List

## Executive Summary

To-Do-List is an AI-assisted task manager for people who juggle many tasks across
different parts of their life — students, classmates, and individuals with school,
work, and personal commitments competing for the same attention. It does the
ordinary work of a to-do list (create, read, update, delete tasks) and adds one
thing on top: every time a task is captured, an AI assistant proposes the
metadata a user would otherwise have to add by hand — a set of tags, a priority
level, and a short summary — plus smart lists that group tasks automatically. The
user is always the decision-maker: the AI suggests, the user accepts, edits, or
rejects each suggestion.

The product is local-first and requires no account. Tasks live in the device's
local storage and the app works offline, so the core experience needs no backend
to pay for or secure. An account and basic cloud sync are optional, opt-in
features — with a minimal backend behind them — for people who want their tasks
on more than one device or want to share a list.

To-Do-List is the solo project for IBE160 (Programmering med KI) at Høgskolen i
Molde, due at the end of November 2026. It is deliberately scoped as a "Simple"
difficulty build: enough CRUD and data modelling to be a real application, with
the graded emphasis on a practical, honest use of a basic AI model.

## The Problem

People managing tasks across several life contexts spend real effort on
organizing rather than doing. A task like "email the group about Thursday's
meeting" has to be manually tagged (school? group project?), manually prioritized,
and manually filed into the right list. In practice this rarely happens — the
maker's own task lists included — so the list becomes a flat, undifferentiated
pile that is hard to trust and easy to abandon. Some task apps now automate the
tagging, but usually behind a paid tier; the free path still leaves the sorting
to the user. For a student with a dozen small obligations a week, the overhead of
keeping a task list well-organized often exceeds the overhead of just remembering
things — which is exactly when things get dropped.

## The Solution

To-Do-List keeps task capture as fast as typing a sentence, then offloads the
organizing to an AI assistant:

- **Create / Read / Update / Delete** tasks with the fields that matter: task
  text, due date, project association, and notes.
- **AI suggestions on capture:** for each task the assistant proposes a set of
  tags, a priority level, and a one-line summary.
- **User in control:** every suggestion is shown before it is applied. The user
  accepts it, edits it, or rejects it. Nothing is filed automatically without a
  visible, reversible choice.
- **Smart lists:** the app derives grouped views (for example "due this week",
  "high priority", or by tag) from the task data and AI metadata, so the user
  gets structure without building it.
- **Local-first:** everything works on a single device with no login and no
  network. Optional account creation unlocks basic sync and list sharing.

The suggestion engine starts as a local rule-based / keyword classifier — cheap,
private, offline, and predictable. Whether v1 also ships a real AI model (cloud
or a small local one) is still open, and it matters more than a normal upgrade
question: the course grade weights the AI feature heavily, so a rules-only
classifier may not clear that bar on its own (see *Open Decision Point*).

## What Makes This Different

This is a course project, and the brief should be honest about that: To-Do-List is
not trying to out-feature Todoist or TickTick, both of which now ship AI tagging.
Its point of difference is scoped and real:

- **Suggestion-first, not automation-first.** The interaction model is explicitly
  "AI proposes, human disposes" — every AI output is a reviewable draft, never a
  silent change. This is a defensible product stance (users keep trust in their
  list) and a good fit for a project graded on a *thoughtful* application of AI.
- **Local-first by default.** The core app needs no account, no network, and no
  server — task data and the baseline AI both run on the device. Sync, list
  sharing, and cloud AI are opt-in add-ons; they do add a minimal backend, but
  nothing about the primary experience depends on it.
- **Deliberately small AI surface.** Three suggestion types and smart lists —
  narrow enough to implement well and evaluate honestly within the timeframe.

## Who This Serves

**Primary — the multi-context juggler.** A student or early-career person with
tasks spanning school, a group project, a part-time job, and personal life. They
capture tasks in a hurry, rarely tag or prioritize them by hand, and want a list
they can trust at a glance. Success for them: they open To-Do-List and immediately
see what matters today without having done any filing.

**Secondary — small informal groups (classmates).** People who want to share a
task list for a group assignment. They need optional accounts and basic sync;
they do not need real-time collaboration. Success for them: everyone sees the
same list, updated within a reasonable delay.

## Success Criteria

**Course / project outcome (primary):**

- A working application demonstrating full CRUD over a well-modelled task entity.
- A practical, working AI feature: tags, priority, and summary suggestions
  generated from task content, with a clear accept / edit / reject flow.
- Smart lists derived from task and AI data.
- Documentation of the AI approach: the rules-vs-model decision and its
  rationale, and the privacy trade-offs considered.
- Submitted by end of November 2026.

**User success signals:**

- A new task can be captured in under ~10 seconds including reviewing AI
  suggestions.
- The default smart lists are the ones users actually open.

## Scope

**In scope for v1:**

- Fully functional single-device experience: CRUD tasks with text, due date,
  project association, notes.
- AI suggestions: tags, priority level, short summary — each individually
  reviewable (accept / edit / reject).
- A local rule-based / keyword suggestion engine as the default.
- Smart lists derived from task data and AI metadata (e.g. by due window, by
  priority, by tag).
- Local device storage in a single responsive web app (PWA); no login required;
  works offline.
- Optional account creation, basic cloud sync (last-write-wins on conflicting
  edits, no merge UI), and list sharing.
- Archiving of completed tasks: 30-day default, user-configurable.
- Runs as one responsive app across web, desktop, mobile, and tablet.

**Explicitly out of v1:**

- Real-time multi-device sync, and any merge or conflict-resolution UI beyond
  last-write-wins.
- Real-time multi-user collaboration on a shared list.
- Online purchase / payment features.
- Notifications and reminders.
- Native mobile or desktop app packaging.

## Privacy Posture

Task data stays on the device by default. Nothing is uploaded unless the user
opts into sync or list sharing, which requires creating an account. If a cloud AI
model is offered, sending task text to it is opt-in on the same basis; the
default local suggestion engine never sends data anywhere.

## Open Decision Point

One choice is deferred to the PRD / architecture stage:

- **Which suggestion engine ships in v1.** The local rule-based classifier is the
  committed baseline. Whether v1 also ships a real AI model — a cloud option
  (OpenAI / Claude) or a small local one — is not yet decided, along with the
  cost, network dependency, and privacy handling that implies. Resolve this
  first in the PRD: the course grade leans on the AI feature, and the rule-based
  baseline on its own may not clear that bar.

## Vision

If it succeeds as a course project and the maker keeps going: To-Do-List grows into
a genuinely local-first personal task manager where AI handles all the
organizing overhead — tagging, prioritizing, summarizing, grouping, and surfacing
what matters now — while the user never loses the sense that it is *their* list.
Sync becomes seamless across devices without a heavyweight account, and the
suggestion-review model extends to more of the workflow (suggested due dates,
suggested next actions) — always as drafts the user can wave through or override.
