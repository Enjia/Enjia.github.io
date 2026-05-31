export function resolveRoute(hash, primaryEssaySlug) {
  const route = hash.replace(/^#\/?/, '');
  if (!route) return { kind: 'essay', slug: primaryEssaySlug };
  if (route === 'review') return { kind: 'review' };
  if (route === 'tilelang/labs') return { kind: 'labs', topic: 'tilelang' };
  if (route === 'compiler/labs') return { kind: 'labs', topic: 'compiler' };
  return { kind: 'essay', slug: route };
}
