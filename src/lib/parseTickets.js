export function parseTickets(raw) {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) {
    return { items: [], error: '' };
  }

  let data;
  try {
    data = JSON.parse(trimmed);
  } catch {
    return { items: [], error: 'Invalid JSON. Paste a valid array of ticket objects.' };
  }

  if (!Array.isArray(data)) {
    return { items: [], error: 'Expected a JSON array of ticket objects.' };
  }

  const items = data
    .filter((entry) => entry && typeof entry.key === 'string' && typeof entry.summary === 'string')
    .map((entry) => `${entry.key.trim()} - ${entry.summary.trim()}`);

  if (items.length === 0) {
    return { items: [], error: 'No valid tickets found. Each entry needs a "key" and a "summary".' };
  }

  return { items, error: '' };
}
