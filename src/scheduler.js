const DAY_MS = 24 * 60 * 60 * 1000;

export const REVIEW_STAGES = [
  { label: 'In-text', delayDays: 0 },
  { label: '5 days', delayDays: 5 },
  { label: '2 weeks', delayDays: 14 },
  { label: '1 month', delayDays: 30 },
  { label: '2 months', delayDays: 60 },
  { label: 'Long-term', delayDays: 180 }
];

export function scheduleReview(previous, rating, now = new Date()) {
  if (!['remembered', 'forgotten'].includes(rating)) {
    throw new Error(`Unknown review rating: ${rating}`);
  }

  const priorStage = Number.isInteger(previous?.stage) ? previous.stage : 0;
  const nextStage =
    rating === 'remembered'
      ? Math.min(priorStage + 1, REVIEW_STAGES.length - 1)
      : 0;
  const delayDays = rating === 'forgotten' ? 1 : REVIEW_STAGES[nextStage].delayDays;
  const reviewedAt = now.toISOString();
  const dueAt = new Date(now.getTime() + delayDays * DAY_MS).toISOString();
  const history = Array.isArray(previous?.history) ? previous.history : [];

  return {
    stage: nextStage,
    stageLabel: REVIEW_STAGES[nextStage].label,
    dueAt,
    lastReviewedAt: reviewedAt,
    attempts: (previous?.attempts ?? 0) + 1,
    history: [
      ...history,
      {
        rating,
        reviewedAt,
        nextStage,
        dueAt
      }
    ]
  };
}

export function isDue(progressRecord, now = new Date()) {
  if (!progressRecord?.dueAt) return false;
  return new Date(progressRecord.dueAt).getTime() <= now.getTime();
}

export function getDueCards(cards, progress, now = new Date()) {
  return cards.filter((card) => isDue(progress[card.id], now));
}
