export function resolveRoute(hash, primaryEssaySlug) {
  const route = hash.replace(/^#\/?/, '');
  if (!route) return { kind: 'essay', slug: primaryEssaySlug };
  if (route === 'review') return { kind: 'review' };
  return { kind: 'essay', slug: route };
}
