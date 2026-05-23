# 📖 Reading Mode AI

> **Strip the noise. Read what matters.**
> Instantly annotates news articles with AI-powered summaries, key verbatim quotes, fact-checking flags, and a comprehensive article quality score.

<div align="center">

[![Chrome MV3](https://img.shields.io/badge/Chrome-Manifest_V3-7C6AFF?style=for-the-badge&logo=google-chrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.0_Flash-D4AF37?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)
[![Streak](https://img.shields.io/badge/Day-02_/_180-vanilla?style=for-the-badge&logo=github&logoColor=white)](https://x.com/happy_ships)

</div>

---

## 📖 The Problem & The Solution

When opening online articles or blog posts, it's easy to waste time skimming through long text only to realize the content lacks evidence, is heavily biased, or simply misses the core point.

**Reading Mode AI** is your instant article companion. In one click, it processes any web page and generates an inline reading report—delivering a punchy 2-sentence summary, the 3 most crucial sentences quoted verbatim, unverified claims that deserve a fact-check, and an objective quality score.

![Demo Screen](readmodegif.gif)

---

## ⚡ Core Features

- 📝 **The Instant TL;DR** — Condenses the entire article's thesis and core points into two clean, impactful sentences.
- 🔑 **3 Key Sentences** — Isolates the 3 most crucial verbatim sentences in the text so you know exactly what is worth highlighting.
- 🟨 **Claims to Fact-Check** — Automatically flags specific unverified statements, statistical assertions, or anonymous sourcing, explaining exactly why they deserve fact-checking.
- 📊 **Article Quality Score** — Measures the article's bias levels, citation evidence quality, and reading difficulty to generate an overall authority grade.
- 🚪 **"What's Missing" Critique** — Explains what counterpoints, structural angles, or alternative perspectives the article chose to omit.
- ⏱ **progressive Scanning Preview** — Shows a dynamic loading indicator and word-count statistics while the underlying Gemini model parses the page text.

---

## 🛠 Getting Started

### 1. Load the Extension
1. Clone this repository locally.
2. Open Chrome and navigate to `chrome://extensions`.
3. Toggle on **Developer mode** in the top right.
4. Click **Load unpacked** and select the `reading-mode-ai` folder.

### 2. Configure Your Keys
Open the extension popup and click the **⚙** gear icon to set your secure API keys:
- **Gemini Key** — Get one for free at [aistudio.google.com](https://aistudio.google.dev/).
- **OpenRouter Key** (fallback) — Get one at [openrouter.ai](https://openrouter.ai).

---

## 🔧 Technical Stack

- **Extension Framework**: Chrome Extension Manifest V3
- **Primary AI Engine**: Gemini 2.0 Flash via AI Studio SDK
- **Fallback Engine**: OpenRouter API
- **Client Implementation**: Pure Vanilla JS, no build steps, zero bulky dependencies. Runs directly out of the folder.

---

## 📅 180 Days of Building
This project is part of a larger developer journey: shipping one useful AI tool/extension every day for 180 days.

Follow along for daily releases and tech-stack deep dives:
- **Twitter / X**: [@happy_ships](https://x.com/happy_ships)
- **Day**: `02 / 180`

---

*Licensed under the [MIT License](LICENSE).*
