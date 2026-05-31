import {
  essays,
  getAllCards,
  getEssay,
  getLabs,
  normalizeCards,
  primaryEssaySlug,
  reviewIntervals,
  seriesNavigation
} from './content.js';
import { decodeJsonScriptData, encodeJsonScriptData } from './render-utils.js';
import { resolveRoute } from './routing.js';
import { getDueCards, scheduleReview } from './scheduler.js';
import { createProgressStore } from './storage.js';

const app = document.querySelector('#app');
const store = createProgressStore();

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatInline(value) {
  return escapeHtml(value).replace(/`([^`]+)`/g, '<code>$1</code>');
}

function nav(route) {
  const labsHref =
    (route.kind === 'essay' && route.slug === 'compiler') || (route.kind === 'labs' && route.topic === 'compiler')
      ? '#/compiler/labs'
      : '#/tilelang/labs';
  return `
    <header class="topbar">
      <a class="brand" href="#/">Kernel Garden</a>
      <nav class="toplinks" aria-label="Primary navigation">
        <a class="${route.kind === 'essay' ? 'active' : ''}" href="#/">Essay</a>
        <a class="${route.kind === 'labs' ? 'active' : ''}" href="${labsHref}">Labs</a>
        <a class="${route.kind === 'review' ? 'active' : ''}" href="#/review">Review</a>
      </nav>
    </header>
  `;
}

function shell(route, body) {
  app.innerHTML = `
    <div class="site-shell">
      ${nav(route)}
      ${body}
    </div>
  `;
}

function sidebar(activeSlug) {
  const progress = store.readProgress();
  const allCards = getAllCards();
  const dueCards = getDueCards(allCards, progress, new Date());
  const answered = Object.keys(progress).length;

  return `
    <aside class="essay-sidebar" aria-label="Series navigation and review progress">
      <section class="sidebar-section">
        <p class="sidebar-label">series</p>
        <ol class="series-list">
          ${seriesNavigation
            .map(
              (entry) => `
                <li class="${entry.slug === activeSlug ? 'active' : ''}">
                  <a href="#/${entry.slug === primaryEssaySlug ? '' : entry.slug}">
                    <span class="series-title">${escapeHtml(entry.title)}</span>
                    <span class="series-meta">${escapeHtml(entry.status)}</span>
                  </a>
                </li>
              `
            )
            .join('')}
        </ol>
      </section>
      <section class="sidebar-section">
        <p class="sidebar-label">review schedule</p>
        <div class="interval-curve">
          ${reviewIntervals.map((interval) => `<span>${escapeHtml(interval)}</span>`).join('')}
        </div>
      </section>
      <section class="sidebar-section progress-box">
        <p class="sidebar-label">local progress</p>
        <div class="progress-row"><span>Cards answered</span><strong>${answered}</strong></div>
        <div class="progress-row"><span>Due now</span><strong>${dueCards.length}</strong></div>
        <a class="text-link" href="#/review">Open review queue</a>
      </section>
    </aside>
  `;
}

function renderEssay(slug) {
  const essay = getEssay(slug);
  const knownEssay = essays.some((item) => item.slug === slug);
  if (!knownEssay) {
    renderComingSoon(slug);
    return;
  }

  const route = { kind: 'essay', slug: essay.slug };
  shell(
    route,
    `
      <main class="essay-page">
        <article class="essay-body">
          <header class="essay-header">
            <p class="eyebrow">mnemonic essay</p>
            <h1>${escapeHtml(essay.title)}</h1>
            <p class="subtitle">${escapeHtml(essay.subtitle)}</p>
            <p class="byline">${escapeHtml(essay.author)} · interactive draft</p>
            <p class="deck-description">${escapeHtml(essay.deckDescription)}</p>
          </header>
          ${essay.sections.map((section) => renderSection(section)).join('')}
        </article>
        ${sidebar(essay.slug)}
      </main>
    `
  );
}

function renderComingSoon(slug) {
  const entry = seriesNavigation.find((item) => item.slug === slug) ?? seriesNavigation[0];
  const route = { kind: 'essay', slug };
  shell(
    route,
    `
      <main class="essay-page">
        <article class="essay-body">
          <header class="essay-header">
            <p class="eyebrow">series essay</p>
            <h1>${escapeHtml(entry.title)}</h1>
            <p class="subtitle">${escapeHtml(entry.subtitle)}</p>
          </header>
          <p>This essay is part of the series. The current prototype now includes the opening four essays, and later planned essays will follow the same mnemonic-medium structure.</p>
        </article>
        ${sidebar(slug)}
      </main>
    `
  );
}

function renderSection(section) {
  if (section.type === 'paragraph') return renderParagraph(section);
  if (section.type === 'inlineFigure') return renderInlineFigure(section);
  if (section.type === 'reviewSet') return renderReviewSet(section);
  if (section.type === 'artifact') return renderArtifact(section);
  return '';
}

function renderParagraph(section) {
  return `
    <section class="essay-section">
      ${section.kicker ? `<p class="section-kicker">${escapeHtml(section.kicker)}</p>` : ''}
      <p>${formatInline(section.text)}</p>
    </section>
  `;
}

function renderReviewSet(section) {
  const cards = normalizeCards(section);
  const firstCard = cards[0];
  return `
    <section class="review-set" data-review-set>
      <div class="review-set-header">
        <p class="review-label">${escapeHtml(section.label ?? 'remember')}</p>
        <h2>${escapeHtml(section.title)}</h2>
        <p>${escapeHtml(section.intro)}</p>
      </div>
      <div class="inline-card" data-card-id="${escapeHtml(firstCard.id)}" data-card-index="0">
        ${renderInlineCard(firstCard, 0, cards.length)}
      </div>
      <script type="application/json" data-role="review-cards">${encodeJsonScriptData(cards)}</script>
    </section>
  `;
}

function renderInlineFigure(section) {
  return `
    <figure class="inline-figure" id="${escapeHtml(section.id)}">
      ${section.label ? `<p class="figure-label">${escapeHtml(section.label)}</p>` : ''}
      <figcaption>
        <strong>${escapeHtml(section.title)}</strong>
        <span>${formatInline(section.caption)}</span>
      </figcaption>
      <div class="figure-rows">
        ${section.rows
          .map(
            (row) => `
              <div class="figure-row">
                <span>${escapeHtml(row[0])}</span>
                <code>${escapeHtml(row[1])}</code>
              </div>
            `
          )
          .join('')}
      </div>
    </figure>
  `;
}

function renderInlineCard(card, index, total) {
  const progress = store.readProgress()[card.id];
  const status = progress
    ? `Scheduled for ${new Date(progress.dueAt).toLocaleDateString()} · ${progress.stageLabel}`
    : `${index + 1} / ${total}`;

  return `
    <p class="card-count">${escapeHtml(status)}</p>
    <p class="card-prompt">${formatInline(card.prompt)}</p>
    <div class="answer" data-role="answer">${formatInline(card.answer)}</div>
    <div class="feedback" data-role="feedback">${formatInline(card.feedback ?? 'Use the answer to locate the specific distinction you missed, then continue with the next card.')}</div>
    <div class="actions">
      <button class="btn secondary" data-action="reveal-answer">Reveal</button>
      <button class="btn rating" data-action="rate-card" data-rating="remembered">Remembered</button>
      <button class="btn rating ghost" data-action="rate-card" data-rating="forgotten">Didn't remember</button>
      <button class="btn continue" data-action="continue-card">Continue</button>
    </div>
  `;
}

function renderArtifact(section) {
  const firstTab = section.tabs[0];
  const savedPrediction = store.readPrediction(section.prediction.id);
  const evidenceUnlocked = savedPrediction.trim().length > 0;
  return `
    <figure class="artifact" data-artifact data-prediction-id="${escapeHtml(section.prediction.id)}">
      <figcaption>
        <span>${escapeHtml(section.label ?? 'artifact')}</span>
        <strong>${escapeHtml(section.title)}</strong>
        <em>${escapeHtml(section.caption)}</em>
      </figcaption>
      <div class="artifact-prediction">
        <label>
          <span>Predict before evidence</span>
          <textarea data-role="artifact-prediction-input" placeholder="${escapeHtml(section.prediction.placeholder)}">${escapeHtml(savedPrediction)}</textarea>
        </label>
        <div class="actions">
          <button class="btn secondary" data-action="save-artifact-prediction">Save prediction</button>
          <button class="btn" data-action="reveal-artifact-evidence">Reveal evidence</button>
        </div>
        <p class="artifact-status" data-role="artifact-status">${evidenceUnlocked ? 'Evidence unlocked from saved prediction.' : escapeHtml(section.prediction.prompt)}</p>
      </div>
      <div class="tabs">
        ${section.tabs
          .map(
            (tab, index) => `
              <button class="tab-button ${index === 0 ? 'active' : ''}" data-action="select-tab" data-tab-index="${index}" ${(tab.kind === 'evidence' || tab.kind === 'interpretation') && !evidenceUnlocked ? 'disabled' : ''}>
                ${escapeHtml(tab.label)}
              </button>
            `
          )
          .join('')}
      </div>
      <pre data-role="artifact-body"><code>${escapeHtml(firstTab.body)}</code></pre>
      <script type="application/json" data-role="artifact-tabs">${encodeJsonScriptData(section.tabs)}</script>
    </figure>
  `;
}

function renderReview() {
  const allCards = getAllCards();
  const progress = store.readProgress();
  const dueCards = getDueCards(allCards, progress, new Date());
  const route = { kind: 'review' };

  shell(
    route,
    `
      <main class="essay-page">
        <article class="essay-body">
          <header class="essay-header compact">
            <p class="eyebrow">spaced review</p>
            <h1>Review what is due.</h1>
            <p class="subtitle">Only cards that were answered in-text and are due now appear here.</p>
          </header>
          ${
            dueCards.length
              ? dueCards.map(renderReviewCard).join('')
              : '<div class="empty-state"><h2>No cards due right now.</h2><p>Read the essay and answer in-text cards first. The review queue will fill as cards become due.</p></div>'
          }
        </article>
        ${sidebar(primaryEssaySlug)}
      </main>
    `
  );
}

function renderReviewCard(card) {
  return `
    <section class="review-set single-review">
      <div class="review-set-header">
        <p class="review-label">${escapeHtml(card.groupTitle)}</p>
        <h2>${escapeHtml(card.essayTitle)}</h2>
      </div>
      <div class="inline-card" data-card-id="${escapeHtml(card.id)}" data-card-index="0">
        ${renderInlineCard(card, 0, 1)}
      </div>
    </section>
  `;
}

function renderLabs(topic) {
  const labs = getLabs(topic);
  const isCompiler = topic === 'compiler';
  const eyebrow = isCompiler ? 'mlir compiler labs' : 'tilelang labs';
  const title = isCompiler ? 'Inspect the mill.' : 'Practice the forge.';
  const subtitle = isCompiler
    ? 'Three short labs separate IR receipts, bufferization receipts, lowering receipts, and runtime receipts.'
    : 'Three short labs pair a prediction, a GPU path, a no-GPU fallback, and a receipt.';
  const description = isCompiler
    ? 'The compiler labs train the same habit as the essays: name the claim first, then inspect the artifact that can actually prove it.'
    : 'The labs are deliberately smaller than the essay. Each one asks for one observable claim, one inspection path, and one written conclusion.';
  const route = { kind: 'labs', topic };
  shell(
    route,
    `
      <main class="labs-page">
        <article class="labs-body">
          <header class="essay-header compact">
            <p class="eyebrow">${escapeHtml(eyebrow)}</p>
            <h1>${escapeHtml(title)}</h1>
            <p class="subtitle">${escapeHtml(subtitle)}</p>
            <p class="deck-description">${escapeHtml(description)}</p>
          </header>
          <div class="lab-list">
            ${labs.map(renderLabCard).join('')}
          </div>
        </article>
      </main>
    `
  );
}

function renderLabCard(lab, index) {
  return `
    <section class="lab-card" id="${escapeHtml(lab.id)}">
      <p class="review-label">lab ${index + 1}</p>
      <h2>${escapeHtml(lab.title)}</h2>
      <p>${escapeHtml(lab.purpose)}</p>
      <div class="lab-grid">
        <div>
          <h3>Prediction</h3>
          <p>${formatInline(lab.prediction)}</p>
        </div>
        <div>
          <h3>GPU path</h3>
          <p>${formatInline(lab.gpuPath)}</p>
        </div>
        <div>
          <h3>No-GPU fallback</h3>
          <p>${formatInline(lab.fallback)}</p>
        </div>
        <div>
          <h3>Receipt</h3>
          <p>${formatInline(lab.receipt)}</p>
        </div>
      </div>
    </section>
  `;
}

function handleClick(event) {
  const button = event.target.closest('button');
  if (!button) return;

  const action = button.dataset.action;
  if (action === 'reveal-answer') revealAnswer(button);
  if (action === 'rate-card') rateCard(button);
  if (action === 'continue-card') continueCard(button);
  if (action === 'select-tab') selectArtifactTab(button);
  if (action === 'save-artifact-prediction') saveArtifactPrediction(button);
  if (action === 'reveal-artifact-evidence') revealArtifactEvidence(button);
}

function revealAnswer(button) {
  const container = button.closest('.inline-card');
  container?.querySelector('[data-role="answer"]')?.classList.add('visible');
  container?.querySelectorAll('.rating').forEach((ratingButton) => ratingButton.classList.add('visible'));
}

function rateCard(button) {
  const cardElement = button.closest('[data-card-id]');
  const cardId = cardElement?.dataset.cardId;
  if (!cardId) return;

  const progress = store.readProgress();
  const next = scheduleReview(progress[cardId], button.dataset.rating, new Date());
  progress[cardId] = next;
  store.writeProgress(progress);

  if (button.dataset.rating === 'forgotten') {
    cardElement.querySelector('[data-role="answer"]')?.classList.add('visible');
    cardElement.querySelector('[data-role="feedback"]')?.classList.add('visible');
    cardElement.querySelectorAll('.rating').forEach((ratingButton) => ratingButton.classList.remove('visible'));
    cardElement.querySelector('.continue')?.classList.add('visible');
    return;
  }

  advanceCard(cardElement, next);
}

function continueCard(button) {
  const cardElement = button.closest('[data-card-id]');
  const cardId = cardElement?.dataset.cardId;
  const progress = store.readProgress();
  if (!cardElement || !cardId || !progress[cardId]) return;

  advanceCard(cardElement, progress[cardId]);
}

function advanceCard(cardElement, next) {
  const reviewSet = cardElement.closest('[data-review-set]');
  if (!reviewSet) {
    cardElement.innerHTML = `<p class="card-count">Scheduled for ${new Date(next.dueAt).toLocaleDateString()} · ${next.stageLabel}</p>`;
    return;
  }

  const cards = decodeJsonScriptData(reviewSet.querySelector('[data-role="review-cards"]').textContent);
  const currentIndex = Number(cardElement.dataset.cardIndex);
  const nextIndex = currentIndex + 1;

  if (nextIndex >= cards.length) {
    cardElement.innerHTML = `
      <p class="card-count">Review set complete</p>
      <p class="card-prompt">The last card is scheduled for ${new Date(next.dueAt).toLocaleDateString()} · ${next.stageLabel}.</p>
    `;
    return;
  }

  const nextCard = cards[nextIndex];
  cardElement.dataset.cardId = nextCard.id;
  cardElement.dataset.cardIndex = String(nextIndex);
  cardElement.innerHTML = renderInlineCard(nextCard, nextIndex, cards.length);
}

function selectArtifactTab(button) {
  const artifact = button.closest('[data-artifact]');
  const tabsJson = artifact?.querySelector('[data-role="artifact-tabs"]')?.textContent;
  if (!artifact || !tabsJson) return;

  const tabs = decodeJsonScriptData(tabsJson);
  const index = Number(button.dataset.tabIndex);
  const selected = tabs[index];
  artifact.querySelectorAll('.tab-button').forEach((tabButton) => tabButton.classList.remove('active'));
  button.classList.add('active');
  artifact.querySelector('[data-role="artifact-body"] code').textContent = selected.body;
}

function saveArtifactPrediction(button) {
  const artifact = button.closest('[data-artifact]');
  const predictionId = artifact?.dataset.predictionId;
  const input = artifact?.querySelector('[data-role="artifact-prediction-input"]');
  if (!artifact || !predictionId || !input) return;

  store.writePrediction(predictionId, input.value);
  artifact.querySelector('[data-role="artifact-status"]').textContent = input.value.trim()
    ? 'Prediction saved. You can reveal evidence when ready.'
    : 'Prediction saved empty. Write a concrete prediction before revealing evidence.';
}

function revealArtifactEvidence(button) {
  const artifact = button.closest('[data-artifact]');
  const predictionId = artifact?.dataset.predictionId;
  const input = artifact?.querySelector('[data-role="artifact-prediction-input"]');
  const status = artifact?.querySelector('[data-role="artifact-status"]');
  if (!artifact || !predictionId || !input || !status) return;

  if (!input.value.trim()) {
    status.textContent = 'Write a prediction first. The point is to expose your model before seeing evidence.';
    input.focus();
    return;
  }

  store.writePrediction(predictionId, input.value);
  artifact.querySelectorAll('.tab-button[disabled]').forEach((tabButton) => {
    tabButton.disabled = false;
  });
  status.textContent = 'Evidence unlocked. Compare it against your prediction before reading the interpretation.';
}

function renderRoute() {
  const route = resolveRoute(window.location.hash, primaryEssaySlug);
  if (route.kind === 'review') renderReview();
  else if (route.kind === 'labs') renderLabs(route.topic);
  else renderEssay(route.slug);
}

window.addEventListener('hashchange', renderRoute);
app.addEventListener('click', handleClick);
renderRoute();
