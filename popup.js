document.addEventListener('DOMContentLoaded', () => {
  let currentMode = 'full';

  document.querySelectorAll('.mode-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.mode-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentMode = pill.dataset.mode;
    });
  });

  const actionBtn = document.getElementById('action-btn');
  const retryBtn = document.getElementById('retry-btn');
  const copyBtn = document.getElementById('copy-btn');
  const rerunBtn = document.getElementById('rerun-btn');
  const mainContent = document.getElementById('main-content');
  const loading = document.getElementById('loading');
  const result = document.getElementById('result');
  const resultContent = document.getElementById('result-content');
  const error = document.getElementById('error');
  const errorMessage = document.getElementById('error-message');

  const settingsBtn = document.getElementById('settings-btn');
  const settingsPanel = document.getElementById('settings-panel');
  const settingsClose = document.getElementById('settings-close');
  const geminiKeyInput = document.getElementById('gemini-key-input');
  const openrouterKeyInput = document.getElementById('openrouter-key-input');
  const saveKeysBtn = document.getElementById('save-keys-btn');
  const clearKeysBtn = document.getElementById('clear-keys-btn');
  const toggleGeminiKey = document.getElementById('toggle-gemini-key');
  const toggleOpenrouterKey = document.getElementById('toggle-openrouter-key');

  // ---- Markdown → HTML ----

  function renderMarkdown(text) {
    let html = text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^---$/gm, '<hr>');

    html = html.replace(/((?:^\|.+\|$\n?)+)/gm, (tableBlock) => {
      const rows = tableBlock.trim().split('\n').filter(r => r.trim());
      if (rows.length < 2 || !/^\|[\s\-:]+\|/.test(rows[1])) return tableBlock;
      const parseRow = (row) => row.split('|').slice(1, -1).map(c => c.trim());
      const headers = parseRow(rows[0]);
      let table = '<table><thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
      rows.slice(2).forEach(row => {
        const cells = parseRow(row);
        table += '<tr>' + cells.map(c => `<td>${c.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</td>`).join('') + '</tr>';
      });
      return table + '</tbody></table>';
    });

    html = html.replace(/((?:^- .+$\n?)+)/gm, (block) => {
      return '<ul>' + block.trim().split('\n').map(l => `<li>${l.replace(/^- /, '').trim()}</li>`).join('') + '</ul>';
    });
    html = html.replace(/((?:^\d+\. .+$\n?)+)/gm, (block) => {
      return '<ol>' + block.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '').trim()}</li>`).join('') + '</ol>';
    });
    html = html.split(/\n{2,}/).map(chunk => {
      const t = chunk.trim();
      if (!t) return '';
      if (/^<(h[2-4]|ul|ol|table|hr)/.test(t)) return t;
      return `<p>${t.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    return html;
  }

  // ---- UI State Machine ----

  function showState(state) {
    mainContent.classList.toggle('hidden', state !== 'idle');
    loading.classList.toggle('hidden', state !== 'loading');
    result.classList.toggle('hidden', state !== 'result');
    error.classList.toggle('hidden', state !== 'error');
    if (state === 'result') result.classList.add('fade-in');
  }

  function showResult(text, isProgressive = false) {
    const badge = isProgressive ? '<span class="progressive-badge">⏳ Annotating your article...</span>' : '';
    resultContent.innerHTML = badge + renderMarkdown(text);
    showState('result');
    if (!isProgressive) {
      chrome.storage.session.set({ cached_result: text, cached_at: Date.now() });
    }
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    showState('error');
  }

  // ---- Restore cache on popup open ----

  chrome.storage.session.get(['cached_result', 'cached_at'], (data) => {
    if (data.cached_result && data.cached_at) {
      if (Date.now() - data.cached_at < 10 * 60 * 1000) {
        resultContent.innerHTML = renderMarkdown(data.cached_result);
        showState('result');
        return;
      }
    }
    showState('idle');
  });

  // ============================================
  // ▼▼▼ ACTION LOGIC ▼▼▼
  // ============================================

  async function getPageContent() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new Error('No active tab found.');
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      throw new Error('Cannot read Chrome internal pages.');
    }
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractContent' });
      if (response?.text?.length > 100) return response;
    } catch (e) {}
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const article = document.querySelector('article') || document.querySelector('main') || document.body;
          const clone = article.cloneNode(true);
          clone.querySelectorAll('script, style, nav, footer, aside, header, iframe, .ad, [class*="ad-"], [class*="sidebar"]').forEach(el => el.remove());
          return {
            title: document.title,
            url: window.location.href,
            text: clone.innerText.replace(/\n{3,}/g, '\n\n').trim().slice(0, 15000),
          };
        },
      });
      if (results?.[0]?.result) return results[0].result;
    } catch (e) {}
    throw new Error('Could not read this page. Try refreshing first.');
  }

  async function runAction() {
    showState('loading');
    try {
      const page = await getPageContent();
      if (!page.text || page.text.length < 200) {
        showError('Not enough text to analyze. Try a news article or blog post.');
        return;
      }

      const wordCount = page.text.split(/\s+/).length;
      const readTime = Math.ceil(wordCount / 200);
      const domain = new URL(page.url).hostname.replace('www.', '');

      // Phase 1: Instant local preview
      const modeLabel = currentMode === 'brief' ? 'Quick Take' : currentMode === 'critical' ? 'Fact Check' : 'Deep Read';
      showResult(`## 📖 ${page.title.slice(0, 60)}\n\n**${domain}** · ${wordCount.toLocaleString()} words · ~${readTime} min read\n\n*Running ${modeLabel} analysis...*`, true);

      // Phase 2: Mode-specific AI analysis
      const modePrompts = {
        brief: `Article: "${page.title}"\n\nText:\n${page.text.slice(0, 5000)}\n\nGive a brutally brief analysis:\n\n## ⚡ TLDR\n1-2 sentences only. The entire point of the article.\n\n## 🔑 Top 3 Sentences\nQuote the 3 most important sentences verbatim.\n\n## ⏱ Worth Reading?\nYes / Skim / Skip — and one sentence why.`,
        critical: `Article: "${page.title}"\nURL: ${page.url}\n\nText:\n${page.text.slice(0, 8000)}\n\nFact-check this article:\n\n## ⚠️ Claims to Verify\nList 4-5 specific claims that need fact-checking. Quote each claim, then explain what's suspicious or unverified.\n\n## 📰 Source & Bias Check\n- **Publication bias:** Left / Center / Right — evidence for this?\n- **Missing perspectives:** Who's not being heard?\n- **Conflicts of interest:** Any to flag?\n\n## ✅ What Checks Out\n2-3 things in the article that appear accurate and well-sourced.`,
        full: `Article: "${page.title}"\nURL: ${page.url}\n\nFull text:\n${page.text.slice(0, 8000)}\n\nAnalyze this article and provide:\n\n## ⚡ TLDR (2 sentences max)\n[The entire article's point, brutally condensed]\n\n## 🔑 3 Key Sentences\nQuote the 3 most important sentences from the article verbatim (under 30 words each). These are the ones worth highlighting.\n1. "..."\n2. "..."\n3. "..."\n\n## ⚠️ Claims to Fact-Check\nList 2-3 specific claims in the article that seem unverified or that a skeptical reader should verify. Quote the claim, then explain why it needs checking.\n\n## 📊 Article Quality Score\n- **Bias level:** X/10 (0=neutral, 10=highly biased)\n- **Evidence quality:** X/10\n- **Reading difficulty:** [Easy / Medium / Hard]\n- **Estimated reading time:** ${readTime} min\n\n## 💡 What's Missing\nOne important angle or counterpoint the article didn't address.`,
      };
      const fullPrompt = modePrompts[currentMode] || modePrompts.full;

      chrome.runtime.sendMessage(
        {
          action: 'callGeminiBackground',
          prompt: fullPrompt,
          options: {
            systemInstruction: 'You are a critical reading assistant. Be precise, quote directly from the text, and flag genuine concerns — not generic ones.',
            temperature: 0.4,
          },
        },
        (response) => {
          if (response?.success) showResult(response.data, false);
          else showError(response?.error || 'Analysis failed. Try again.');
        }
      );
    } catch (err) {
      showError(err.message || 'Something went wrong.');
    }
  }

  // ============================================
  // ▲▲▲ END ACTION LOGIC ▲▲▲
  // ============================================

  // ---- Settings Panel ----

  function openSettings() {
    settingsPanel.classList.remove('hidden');
    settingsPanel.classList.add('fade-in');
    chrome.storage.local.get(['gemini_api_key', 'openrouter_api_key'], (data) => {
      geminiKeyInput.value = data.gemini_api_key || '';
      openrouterKeyInput.value = data.openrouter_api_key || '';
    });
  }

  function closeSettings() {
    settingsPanel.classList.add('hidden');
    settingsPanel.classList.remove('fade-in');
  }

  settingsBtn.addEventListener('click', openSettings);
  settingsClose.addEventListener('click', closeSettings);

  toggleGeminiKey.addEventListener('click', () => {
    geminiKeyInput.type = geminiKeyInput.type === 'password' ? 'text' : 'password';
  });
  toggleOpenrouterKey.addEventListener('click', () => {
    openrouterKeyInput.type = openrouterKeyInput.type === 'password' ? 'text' : 'password';
  });

  saveKeysBtn.addEventListener('click', () => {
    const updates = {};
    const gk = geminiKeyInput.value.trim();
    const ok = openrouterKeyInput.value.trim();
    if (gk) updates.gemini_api_key = gk;
    if (ok) updates.openrouter_api_key = ok;
    if (!Object.keys(updates).length) return;
    chrome.storage.local.set(updates, () => {
      saveKeysBtn.textContent = '✅ Saved';
      setTimeout(() => { saveKeysBtn.textContent = 'Save Keys'; }, 1500);
    });
  });

  clearKeysBtn.addEventListener('click', async () => {
    await resetApiKeys();
    geminiKeyInput.value = '';
    openrouterKeyInput.value = '';
    clearKeysBtn.textContent = '✅ Cleared';
    setTimeout(() => { clearKeysBtn.textContent = 'Clear All Keys'; }, 1500);
  });

  // ---- Event Listeners ----

  actionBtn.addEventListener('click', runAction);
  retryBtn.addEventListener('click', runAction);
  rerunBtn.addEventListener('click', runAction);

  copyBtn.addEventListener('click', () => {
    const temp = document.createElement('div');
    temp.innerHTML = resultContent.innerHTML;
    const text = temp.textContent || temp.innerText;
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = '✅';
      setTimeout(() => { copyBtn.textContent = '📋'; }, 1500);
    });
  });
});
