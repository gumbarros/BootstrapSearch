import type { BootstrapSearchIcons, IconRenderer, IconState } from './types';

const iconSvg = (path: string, className = '') => (
  `<svg class="bootstrap-search-icon ${className}" aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">${path}</svg>`
);

export const DEFAULT_ICONS: Required<BootstrapSearchIcons> = {
  search: iconSvg('<path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85Zm-5.242.656a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z"/>'),
  loading: '<span class="spinner-border spinner-border-sm text-secondary" role="status"><span class="visually-hidden">Loading...</span></span>',
  success: iconSvg('<path d="M13.485 1.929a1 1 0 0 1 .086 1.414l-7.25 8.25a1 1 0 0 1-1.47.035L2.43 9.207a1 1 0 1 1 1.414-1.414l1.667 1.667 6.56-7.445a1 1 0 0 1 1.414-.086Z"/>', 'text-success'),
  empty: iconSvg('<path d="M3.404 2.697a1 1 0 0 1 1.414 0L8 5.879l3.182-3.182a1 1 0 1 1 1.414 1.414L9.414 7.293l3.182 3.182a1 1 0 0 1-1.414 1.414L8 8.707l-3.182 3.182a1 1 0 0 1-1.414-1.414l3.182-3.182-3.182-3.182a1 1 0 0 1 0-1.414Z"/>'),
  error: iconSvg('<path d="M3.404 2.697a1 1 0 0 1 1.414 0L8 5.879l3.182-3.182a1 1 0 1 1 1.414 1.414L9.414 7.293l3.182 3.182a1 1 0 0 1-1.414 1.414L8 8.707l-3.182 3.182a1 1 0 0 1-1.414-1.414l3.182-3.182-3.182-3.182a1 1 0 0 1 0-1.414Z"/>', 'text-danger'),
  selected: iconSvg('<path d="M13.485 1.929a1 1 0 0 1 .086 1.414l-7.25 8.25a1 1 0 0 1-1.47.035L2.43 9.207a1 1 0 1 1 1.414-1.414l1.667 1.667 6.56-7.445a1 1 0 0 1 1.414-.086Z"/>', 'ms-2')
};

export function resolveIcon(
  icons: Required<BootstrapSearchIcons>,
  state: IconState,
  field: HTMLInputElement
): string | HTMLElement | null {
  const icon = icons[state] as IconRenderer;
  return typeof icon === 'function' ? icon({ field, state }) : icon;
}
