export function calculateEndDate() {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}
