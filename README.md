# Reading Mode AI

> Strip the noise. Read what matters.

**Day 02 / 180 — 180 Days of Building**

You open an article, skim it, and still aren't sure what the point was. This extension automatically annotates any article with AI-powered insights — no typing required. One click gives you a TLDR, the 3 most important sentences verbatim, claims worth fact-checking, and a quality score. Know what you're reading before you read it.

![Demo](readmodegif.gif)

---

## What it does

- **TLDR** — the entire article's point in 2 sentences
- **3 Key Sentences** — the most important verbatim quotes worth highlighting
- **Claims to Fact-Check** — specific unverified statements flagged with reasons why
- **Article Quality Score** — bias level, evidence quality, reading difficulty
- **What's Missing** — the counterpoint or angle the article chose to ignore

---

## How to use

1. Navigate to any news article or blog post
2. Click the extension icon
3. Hit **Enter Reading Mode**
4. Get instant AI annotation in seconds — no typing, no copying, just click

---

## Setup

### 1. Load the extension
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked** → select the `reading-mode-ai` folder

### 2. Add your API key
Click **⚙** in the popup and paste one of the following:

- **Gemini API key** — free at [aistudio.google.com](https://aistudio.google.com/apikey)
- **OpenRouter API key** — free tier at [openrouter.ai](https://openrouter.ai) (use as fallback if Gemini quota runs out)

Only one key is required. If both are saved, Gemini is used first with OpenRouter as fallback.

---

## Tech stack

- Chrome Extension Manifest V3
- Gemini 2.0 Flash (primary) → OpenRouter fallback
- Two-phase progressive loading: instant metadata preview → full AI analysis
- Vanilla JS — no frameworks, no build step

---

## Part of 180 Days of Building

Shipping one AI Chrome extension every day for 180 days.

Follow along: [@happy_ships](https://x.com/happy_ships)
