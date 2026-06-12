import type { BootstrapSearchUserOptions, SelectedItem } from '../src';
import './styles.css';

type DemoItem = Record<string, unknown>;

type ExampleDefinition = {
  id: string;
  title: string;
  description: string;
  placeholder: string;
  source: string;
  init: (field: HTMLInputElement) => void;
};

type HighlightJs = {
  highlightElement(element: Element): void;
};

declare global {
  interface Window {
    hljs?: HighlightJs;
  }
}

const themeStorageKey = 'bootstrap-search-theme';

const characters = [
  { id: 1, name: 'Walter White' },
  { id: 2, name: 'Jesse Pinkman' },
  { id: 3, name: 'Saul Goodman' },
  { id: 4, name: 'Gustavo Fring' },
  { id: 5, name: 'Skyler White' },
  { id: 6, name: 'Hank Schrader' },
  { id: 7, name: 'Mike Ehrmantraut' },
  { id: 8, name: 'Leia Organa' },
  { id: 9, name: 'Han Solo' },
  { id: 10, name: 'Yoda' },
  { id: 11, name: 'Michael Scott' },
  { id: 12, name: 'Dwight Schrute' }
];

const userSearch = {
  remoteData: (q: string) => `https://dummyjson.com/users/search?q=${q}`,
  resolveData: (response: unknown) => (response as { users: DemoItem[] }).users,
  value: 'id'
} satisfies BootstrapSearchUserOptions<DemoItem>;

const examples: ExampleDefinition[] = [
  {
    id: 'local-data',
    title: 'Local Data',
    description: 'Fast autocomplete against in-memory records.',
    placeholder: 'Select a character...',
    source: `const characters = [
  { id: 1, name: 'Walter White' },
  { id: 2, name: 'Jesse Pinkman' },
  { id: 3, name: 'Saul Goodman' }
];

new BootstrapSearch(document.getElementById('local-data'), {
  data: characters,
  inputLabel: 'name',
  dropdownLabel: 'name',
  value: 'id'
});`,
    init: (field) => {
      new window.BootstrapSearch(field, {
        data: characters,
        inputLabel: 'name',
        dropdownLabel: 'name',
        value: 'id',
        onSelectItem: (item: SelectedItem | SelectedItem[] | null) => console.log('Selected local:', item)
      });
    }
  },
  {
    id: 'ajax-users',
    title: 'AJAX Search',
    description: 'Fetch matching options as the query changes.',
    placeholder: 'Type a user name...',
    source: `new BootstrapSearch(document.getElementById('ajax-users'), {
  remoteData: q => \`https://dummyjson.com/users/search?q=\${q}\`,
  resolveData: response => response.users,
  inputLabel: 'firstName',
  dropdownLabel: 'firstName',
  value: 'id'
});`,
    init: (field) => {
      new window.BootstrapSearch<DemoItem>(field, {
        ...userSearch,
        inputLabel: 'firstName',
        dropdownLabel: 'firstName',
        onSelectItem: (item: SelectedItem | SelectedItem[] | null) => console.log('Selected user:', item)
      });
    }
  },
  {
    id: 'custom-label',
    title: 'Custom Rows',
    description: 'Render richer dropdown labels with your own markup.',
    placeholder: 'Type a user...',
    source: `new BootstrapSearch(document.getElementById('custom-label'), {
  remoteData: q => \`https://dummyjson.com/users/search?q=\${q}\`,
  resolveData: response => response.users,
  inputLabel: user => \`\${user.firstName} \${user.lastName}\`,
  dropdownLabel: user => \`
    <div class="avatar-label">
      <img src="https://api.dicebear.com/9.x/pixel-art/svg?seed=\${user.id}" alt="avatar">
      \${user.firstName} \${user.lastName}
    </div>\`,
  value: user => user.id
});`,
    init: (field) => {
      new window.BootstrapSearch<DemoItem>(field, {
        ...userSearch,
        inputLabel: (user) => `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
        dropdownLabel: (user) => {
          const seed = encodeURIComponent(String(user.id ?? user.firstName ?? 'user'));
          const firstName = escapeHtml(user.firstName);
          const lastName = escapeHtml(user.lastName);
          return `<div class="avatar-label"><img src="https://api.dicebear.com/9.x/pixel-art/svg?seed=${seed}" alt="avatar">${firstName} ${lastName}</div>`;
        },
        value: (user) => String(user.id ?? ''),
        onSelectItem: (item: SelectedItem | SelectedItem[] | null) => console.log('Selected custom row:', item)
      });
    }
  },
  {
    id: 'multi-select',
    title: 'Multi-select',
    description: 'Keep multiple choices visible in a compact tokenized control.',
    placeholder: 'Select users...',
    source: `new BootstrapSearch(document.getElementById('multi-select'), {
  remoteData: q => \`https://dummyjson.com/users/search?q=\${q}\`,
  resolveData: response => response.users,
  inputLabel: 'firstName',
  dropdownLabel: 'firstName',
  value: 'id',
  multiSelect: true,
  selectedItems: [
    { id: 87, firstName: 'Hunter' },
    { id: 33, firstName: 'Carter' }
  ]
});`,
    init: (field) => {
      new window.BootstrapSearch<DemoItem>(field, {
        ...userSearch,
        inputLabel: 'firstName',
        dropdownLabel: 'firstName',
        multiSelect: true,
        selectedItems: [
          { id: 87, firstName: 'Hunter' },
          { id: 33, firstName: 'Carter' }
        ],
        onSelectItem: (items: SelectedItem | SelectedItem[] | null) => console.log('Selected users:', items)
      });
    }
  }
];

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getStoredTheme(): 'light' | 'dark' | null {
  const value = localStorage.getItem(themeStorageKey);
  return value === 'light' || value === 'dark' ? value : null;
}

function getPreferredTheme(): 'light' | 'dark' {
  return getStoredTheme()
    ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
}

function themeIcon(theme: 'light' | 'dark'): string {
  if (theme === 'dark') {
    return '<svg aria-hidden="true" viewBox="0 0 16 16" width="18" height="18" fill="currentColor"><path d="M8 1.5a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1A.75.75 0 0 1 8 1.5Zm0 9.25A2.75 2.75 0 1 0 8 5.25a2.75 2.75 0 0 0 0 5.5Zm0 3a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1a.75.75 0 0 1 .75-.75ZM14.5 7.25h-1a.75.75 0 0 0 0 1.5h1a.75.75 0 0 0 0-1.5ZM3.25 8a.75.75 0 0 1-.75.75h-1a.75.75 0 0 1 0-1.5h1A.75.75 0 0 1 3.25 8Zm9.346-4.596a.75.75 0 0 0-1.06-1.06l-.708.707a.75.75 0 1 0 1.061 1.06l.707-.707ZM5.172 12.95a.75.75 0 0 1 0 1.061l-.707.707a.75.75 0 0 1-1.061-1.06l.707-.708a.75.75 0 0 1 1.061 0Zm8.839 1.768a.75.75 0 0 0 1.06-1.06l-.707-.708a.75.75 0 0 0-1.06 1.061l.707.707ZM4.465 2.344a.75.75 0 1 0-1.061 1.06l.707.708a.75.75 0 0 0 1.061-1.061l-.707-.707Z"/></svg>';
  }

  return '<svg aria-hidden="true" viewBox="0 0 16 16" width="18" height="18" fill="currentColor"><path d="M13.5 10.7A6.2 6.2 0 0 1 5.3 2.5a.75.75 0 0 0-.86-.98A7 7 0 1 0 14.48 11.56a.75.75 0 0 0-.98-.86Z"/></svg>';
}

function applyTheme(theme: 'light' | 'dark'): void {
  document.documentElement.setAttribute('data-bs-theme', theme);

  const lightHighlight = document.querySelector<HTMLLinkElement>('#highlight-light');
  const darkHighlight = document.querySelector<HTMLLinkElement>('#highlight-dark');
  if (lightHighlight && darkHighlight) {
    lightHighlight.disabled = theme !== 'light';
    darkHighlight.disabled = theme !== 'dark';
  }

  const toggle = document.querySelector<HTMLButtonElement>('#themeToggle');
  if (toggle) {
    toggle.innerHTML = themeIcon(theme);
    toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    toggle.title = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;
  }
}

function bindThemeToggle(): void {
  const toggle = document.querySelector<HTMLButtonElement>('#themeToggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(themeStorageKey, next);
    applyTheme(next);
  });
}

function renderExamples(): void {
  const container = document.querySelector<HTMLElement>('#exampleCards');
  if (!container) return;

  container.replaceChildren();

  examples.forEach((example) => {
    const column = document.createElement('div');
    column.className = 'col-md-6';

    const card = document.createElement('article');
    card.className = 'card demo-card h-100';

    const body = document.createElement('div');
    body.className = 'card-body';

    const header = document.createElement('div');
    header.className = 'demo-card-header';

    const title = document.createElement('h3');
    title.className = 'h5 mb-1 fw-semibold';
    title.textContent = example.title;

    const description = document.createElement('p');
    description.className = 'text-body-secondary mb-0';
    description.textContent = example.description;
    header.append(title, description);

    const inputWrap = document.createElement('div');
    inputWrap.className = 'demo-input-wrap';

    const input = document.createElement('input');
    input.id = example.id;
    input.type = 'text';
    input.className = 'form-control';
    input.placeholder = example.placeholder;
    input.autocomplete = 'off';
    inputWrap.appendChild(input);

    const codeShell = document.createElement('div');
    codeShell.className = 'demo-code-shell rounded position-relative';


    const pre = document.createElement('pre');
    pre.className = 'demo-code';

    const code = document.createElement('code');
    code.className = 'language-js';
    code.textContent = example.source;
    pre.appendChild(code);
    codeShell.appendChild(pre);

    body.append(header, inputWrap, codeShell);
    card.appendChild(body);
    column.appendChild(card);
    container.appendChild(column);
  });
}

function initializeExamples(): void {
  examples.forEach((example) => {
    const field = document.querySelector<HTMLInputElement>(`#${example.id}`);
    if (field) example.init(field);
  });
}




function highlightCode(): void {
  document.querySelectorAll('pre code').forEach((element) => window.hljs?.highlightElement(element));
}

function loadBootstrapSearch(): Promise<void> {
  if (window.BootstrapSearch) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL('bootstrap-search.js', document.baseURI).toString();
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load bootstrap-search.js'));
    document.head.appendChild(script);
  });
}

async function startDemo(): Promise<void> {
  applyTheme(getPreferredTheme());
  bindThemeToggle();
  renderExamples();
  await loadBootstrapSearch();
  initializeExamples();
  highlightCode();
}

void startDemo();
