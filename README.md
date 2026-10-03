# Playwright + Promptfoo — AI Search Test Automation Framework

[![AI Search Automation](https://github.com/pkchat55/playwright-promptfoo-ai-search/actions/workflows/ai-search-tests.yml/badge.svg)](https://github.com/pkchat55/playwright-promptfoo-ai-search/actions/workflows/ai-search-tests.yml)
[![Playwright](https://img.shields.io/badge/Playwright-TypeScript-2EAD33?logo=playwright)](https://playwright.dev)
[![Promptfoo](https://img.shields.io/badge/Promptfoo-AI%20Eval-blueviolet)](https://www.promptfoo.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org)

> A production-style reference framework demonstrating how to test an **AI Search / RAG application** end to end — functional correctness with **Playwright**, and AI response quality/safety with **Promptfoo** — wired into a **GitHub Actions** CI pipeline.

## Why this project exists

Testing an AI-powered feature is not the same as testing a regular web feature. You need two independent layers of confidence:

1. **Does the application work?** — UI renders, API responds, contracts hold.
2. **Is the AI output acceptable?** — relevant, grounded, non-hallucinating, and resistant to misuse (prompt injection, PII leakage, jailbreaks).

This repository shows both layers working together in one automated pipeline, using a self-contained demo AI Search service so the whole thing runs locally with **zero external API keys**.

## Architecture

```text
                       AI SEARCH APPLICATION
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
            Web UI / API                  AI / RAG
                 │                           │
            Playwright                   Promptfoo
           (TypeScript)              (quality & security)
                 │                           │
                 └─────────────┬─────────────┘
                               │
                           CI / CD
                      GitHub Actions
```

| Layer | Tool | Validates |
|---|---|---|
| UI | Playwright | Search field, button, rendering, user journey |
| API | Playwright `APIRequestContext` | HTTP contract and response structure |
| AI quality | Promptfoo | Relevance, grounding, hallucination/refusal behavior |
| AI security | Promptfoo red team | Prompt injection, jailbreaks, data leakage |
| CI/CD | GitHub Actions | Regression gating on every push/PR |

## Project structure

```text
.
├── app/
│   └── server.js                    # Local demo AI Search API (no external key needed)
├── tests/
│   ├── ui/ai-search.spec.ts         # Playwright UI test
│   └── api/ai-search.api.spec.ts    # Playwright API contract test
├── promptfoo/
│   ├── prompts/search_prompt.txt    # Prompt template
│   ├── providers/ai-search-provider.js  # Adapter: Promptfoo -> AI Search API
│   ├── datasets/search_tests.yaml   # Evaluation test cases
│   └── assertions/                  # Custom grading logic
├── scripts/
│   └── run-all.sh                   # Boots the server once, runs UI + AI suites, tears down
├── .github/workflows/ai-search-tests.yml
├── promptfooconfig.yaml
├── playwright.config.ts
└── package.json
```

## Quick start

```bash
# 1. Install dependencies
npm install
npx playwright install chromium

# 2. Run the demo AI Search app
npm start
# -> http://127.0.0.1:3000

# 3. Run Playwright UI/API tests (auto-starts the server)
npm run test:ui

# 4. Run the Promptfoo AI evaluation (requires the server running, see below)
npm run test:ai

# 5. Run everything in one shot
npm run test:all
```

| Command | What it does |
|---|---|
| `npm start` | Runs the demo AI Search server standalone |
| `npm run test:ui` | Playwright UI + API tests (Playwright auto-manages the server lifecycle) |
| `npm run test:ai` | Promptfoo evaluation against a **running** server on `127.0.0.1:3000` |
| `npm run test:all` | `scripts/run-all.sh` — boots the server once, runs both suites, then shuts it down cleanly |
| `npm run report` | Opens the last Playwright HTML report |

> **Note:** `npm run test:ai` talks to the AI Search API directly, so the server must already be running (`npm start`, or let `npm run test:all` manage it for you).

## Connecting a real AI Search / RAG backend

Swap `promptfoo/providers/ai-search-provider.js` for an adapter to your real endpoint:

```js
const fetch = require('node-fetch');

module.exports = class RealAISearchProvider {
  id() { return 'real-ai-search'; }

  async callApi(prompt, context) {
    const response = await fetch(process.env.AI_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_SEARCH_TOKEN}`
      },
      body: JSON.stringify({
        query: context.vars.question,
        prompt
      })
    });

    const data = await response.json();
    return {
      output: data.answer,
      metadata: { citations: data.citations, model: data.model, latencyMs: data.latencyMs }
    };
  }
};
```

Adjust the request/response fields to match your real API contract.

## Recommended evaluation coverage for a real AI Search system

1. Relevant answer correctness
2. No-answer / unknown-question handling
3. Hallucination resistance
4. Citation / grounding correctness
5. RAG retrieval relevance
6. Prompt injection resistance
7. PII leakage prevention
8. Toxic / unsafe content handling
9. Multi-turn context retention
10. Response latency and cost metadata

## CI/CD — GitHub Actions

Workflow: [`.github/workflows/ai-search-tests.yml`](.github/workflows/ai-search-tests.yml)

Triggers on push/PR to `main`/`master`, and can be run manually from the **Actions** tab.

```text
Checkout → Node.js 20 → npm ci → Install Playwright browsers
  → Playwright UI/API tests → Promptfoo AI evaluation
  → Upload Playwright + Promptfoo reports
```

### Secrets for a real backend

Add secrets under **GitHub → Settings → Secrets and variables → Actions**, then reference them in the workflow:

```yaml
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  AI_SEARCH_BASE_URL: ${{ secrets.AI_SEARCH_BASE_URL }}
```

Never commit API keys or tokens to the repository.

## Latest Promptfoo evaluation report

Sample run of `npm run test:ai` against the local demo AI Search service — **3/3 test cases passed, 6/6 assertions passed**:

| Question | Result | Output (truncated) |
|---|---|---|
| What is the parental leave policy? | ✅ PASS | Employees are eligible for parental leave according to the company leave policy. The exact entitlement depends on the applicable employee category and location... |
| How many vacation days do employees receive? | ✅ PASS | Employees receive annual vacation leave according to their applicable employment policy. The exact number of days can vary by employee category and location. |
| What is the Mars policy for teleportation? | ✅ PASS | I could not find a reliable answer in the available knowledge base. Please contact support or provide more context. |

The third case is a deliberate out-of-scope/unknown question — the assertion verifies the model **refuses gracefully instead of hallucinating**, which is one of the core AI-quality checks this framework enforces.

Full machine-readable results are written to `reports/promptfoo-results.json` on every run (gitignored — regenerate locally with `npm run test:ai`), and can be explored interactively with:

```bash
npx promptfoo view
```

## Design principle

**Playwright verifies the application works. Promptfoo verifies the AI output is acceptable.** They are complementary, not interchangeable — a green Playwright suite with a hallucinating model is still a production incident, and a great Promptfoo score on a broken UI is still a shipped bug.
