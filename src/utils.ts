export function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function removeDiacritics(value: unknown): string {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function appendMarkup(target: HTMLElement, markup: string | HTMLElement | null): void {
  target.replaceChildren();

  if (markup === null) return;

  if (markup instanceof HTMLElement) {
    target.appendChild(markup);
    return;
  }

  target.innerHTML = markup;
}

export function toArray<TItem>(data: TItem[] | Record<string, TItem> | null | undefined): TItem[] {
  if (!data) return [];
  return Array.isArray(data) ? data : Object.values(data);
}
