import { afterEach, describe, expect, it, vi } from 'vitest';
import { BootstrapSearch } from '../src';

interface Person {
  id: number | string;
  name?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
}

function createField(): HTMLInputElement {
  document.body.innerHTML = '<div id="host"><input id="search" type="text"></div>';
  return document.querySelector<HTMLInputElement>('#search')!;
}

function input(field: HTMLInputElement, value: string): void {
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('BootstrapSearch', () => {
  it('filters local data and limits results', () => {
    const field = createField();
    new BootstrapSearch<Person>(field, {
      data: [
        { id: 1, name: 'Walter White' },
        { id: 2, name: 'Skyler White' },
        { id: 3, name: 'Jesse Pinkman' }
      ],
      inputLabel: 'name',
      dropdownLabel: 'name',
      value: 'id',
      maximumItems: 1
    });

    input(field, 'white');

    const items = document.querySelectorAll('.dropdown-item');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain('Walter White');
    expect(field.getAttribute('aria-expanded')).toBe('true');
  });

  it('escapes non-callback labels and highlights matches', () => {
    const field = createField();
    new BootstrapSearch<Person>(field, {
      data: [{ id: 1, name: '<b>Walter</b>' }],
      inputLabel: 'name',
      dropdownLabel: 'name',
      value: 'id'
    });

    input(field, '<b>');

    const item = document.querySelector<HTMLElement>('.dropdown-item')!;
    expect(item.innerHTML).toContain('&lt;b&gt;');
    expect(item.querySelector('b')).toBeNull();
    expect(item.querySelector('.text-primary')).not.toBeNull();
  });

  it('allows custom HTML dropdown labels', () => {
    const field = createField();
    new BootstrapSearch<Person>(field, {
      data: [{ id: 1, firstName: 'Ada', lastName: 'Lovelace' }],
      inputLabel: (item) => `${item.firstName} ${item.lastName}`,
      dropdownLabel: (item) => `<strong>${item.firstName}</strong> ${item.lastName}`,
      value: 'id'
    });

    input(field, 'ada');

    expect(document.querySelector('.dropdown-item strong')?.textContent).toBe('Ada');
  });

  it('supports custom icon markup and null icon suppression', () => {
    const field = createField();
    new BootstrapSearch<Person>(field, {
      icons: {
        search: '<span data-icon="search"></span>',
        success: null
      }
    });

    expect(document.querySelector('[data-icon="search"]')).not.toBeNull();

    field.bootstrapSearch?.setData([{ id: 1, name: 'Ada' }]);
    document.querySelector<HTMLButtonElement>('.dropdown-item')?.click();

    expect(document.querySelector('[data-icon="search"]')).toBeNull();
  });

  it('selects a single item and calls back with label and value', () => {
    const field = createField();
    const onSelectItem = vi.fn();
    new BootstrapSearch<Person>(field, {
      data: [{ id: 1, name: 'Ada' }],
      inputLabel: 'name',
      dropdownLabel: 'name',
      value: 'id',
      onSelectItem
    });

    input(field, 'ada');
    document.querySelector<HTMLButtonElement>('.dropdown-item')?.click();

    expect(field.value).toBe('Ada');
    expect(onSelectItem).toHaveBeenLastCalledWith({ value: 1, label: 'Ada' });
    expect(field.getAttribute('aria-expanded')).toBe('false');
  });

  it('shows multi-select selections as removable chips and updates aria-selected', () => {
    const field = createField();
    const onSelectItem = vi.fn();
    new BootstrapSearch<Person>(field, {
      data: [
        { id: 1, name: 'Ada' },
        { id: 2, name: 'Grace' }
      ],
      inputLabel: 'name',
      dropdownLabel: 'name',
      value: 'id',
      multiSelect: true,
      onSelectItem
    });

    const control = document.querySelector<HTMLElement>('.bootstrap-search-multiselect-control');
    const styles = document.querySelector<HTMLStyleElement>('#bootstrap-search-multiselect-styles');
    expect(styles?.textContent).toContain('.bootstrap-search-multiselect-control:focus-within');
    expect(styles?.textContent).toContain('border-color: rgba(var(--bs-primary-rgb), 0.5)');
    expect(styles?.textContent).toContain('border-color: color-mix(in srgb, var(--bs-primary) 50%, var(--bs-body-bg))');
    expect(styles?.textContent).toContain('box-shadow: 0 0 0 var(--bs-focus-ring-width) var(--bs-focus-ring-color)');

    field.dispatchEvent(new FocusEvent('focus'));
    expect(control?.classList.contains('border-primary')).toBe(false);

    input(field, 'a');
    expect(control?.classList.contains('show')).toBe(true);
    document.querySelector<HTMLButtonElement>('.dropdown-item')?.click();
    input(field, 'g');
    document.querySelector<HTMLButtonElement>('.dropdown-item')?.click();

    expect(field.value).toBe('');
    expect(onSelectItem).toHaveBeenLastCalledWith([
      { value: 1, label: 'Ada' },
      { value: 2, label: 'Grace' }
    ]);
    expect(document.querySelector('.bootstrap-search-multiselect-control')?.contains(field)).toBe(true);
    expect(document.querySelectorAll('.bootstrap-search-selected-item')).toHaveLength(2);
    expect(document.querySelector('.bootstrap-search-selected-items')?.textContent).toContain('Ada');
    expect(document.querySelector('.bootstrap-search-selected-items')?.textContent).toContain('Grace');

    document.querySelector<HTMLButtonElement>('.bootstrap-search-selected-remove')?.click();

    expect(onSelectItem).toHaveBeenLastCalledWith([{ value: 2, label: 'Grace' }]);
    expect(document.querySelectorAll('.bootstrap-search-selected-item')).toHaveLength(1);
    expect(document.querySelector('.dropdown-item')?.getAttribute('aria-selected')).toBe('false');
  });

  it('filters multi-select local data by lookup and maximumItems', () => {
    const field = createField();
    new BootstrapSearch<Person>(field, {
      data: [
        { id: 1, name: 'Ada Lovelace' },
        { id: 2, name: 'Grace Hopper' },
        { id: 3, name: 'Greta Thunberg' }
      ],
      inputLabel: 'name',
      dropdownLabel: 'name',
      value: 'id',
      multiSelect: true,
      maximumItems: 1
    });

    input(field, 'gra');

    const items = document.querySelectorAll('.dropdown-item');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain('Grace Hopper');
  });

  it('updates active descendant with keyboard navigation and selects with enter', () => {
    const field = createField();
    new BootstrapSearch<Person>(field, {
      data: [
        { id: 1, name: 'Ada' },
        { id: 2, name: 'Grace' }
      ],
      inputLabel: 'name',
      dropdownLabel: 'name',
      value: 'id'
    });

    input(field, 'a');
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

    const activeId = field.getAttribute('aria-activedescendant');
    expect(activeId).toBeTruthy();
    expect(document.getElementById(activeId!)?.classList.contains('active')).toBe(true);

    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(field.value).toBe('Grace');
  });

  it('fetches remote GET data through resolveData', async () => {
    const field = createField();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ users: [{ id: 1, firstName: 'Ada' }] })
    });
    vi.stubGlobal('fetch', fetchMock);

    new BootstrapSearch<Person>(field, {
      remoteData: (query) => `/users?q=${query}`,
      inputLabel: 'firstName',
      dropdownLabel: 'firstName',
      value: 'id',
      resolveData: (response) => (response as { users: Person[] }).users
    });

    input(field, 'ada');
    await vi.waitFor(() => expect(document.querySelectorAll('.dropdown-item')).toHaveLength(1));

    expect(fetchMock).toHaveBeenCalledWith('/users?q=ada', expect.objectContaining({ method: 'GET' }));
  });

  it('does not reopen stale remote results below threshold', async () => {
    const field = createField();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ users: [{ id: 1, firstName: 'Ada' }] })
    });
    vi.stubGlobal('fetch', fetchMock);

    new BootstrapSearch<Person>(field, {
      remoteData: (query) => `/users?q=${query}`,
      inputLabel: 'firstName',
      dropdownLabel: 'firstName',
      value: 'id',
      resolveData: (response) => (response as { users: Person[] }).users,
      threshold: 2
    });

    input(field, 'ad');
    await vi.waitFor(() => expect(document.querySelectorAll('.dropdown-item')).toHaveLength(1));

    input(field, 'a');

    expect(document.querySelectorAll('.dropdown-item')).toHaveLength(0);
    expect(field.getAttribute('aria-expanded')).toBe('false');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the error icon visible for failed remote requests', async () => {
    const field = createField();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({})
    }));

    new BootstrapSearch<Person>(field, {
      remoteData: '/users',
      threshold: 1,
      icons: {
        error: '<span data-icon="error"></span>',
        search: '<span data-icon="search"></span>'
      }
    });

    input(field, 'a');
    await vi.waitFor(() => expect(document.querySelector('[data-icon="error"]')).not.toBeNull());

    expect(document.querySelector('[data-icon="search"]')).toBeNull();
  });

  it('posts form data for remote POST requests', async () => {
    document.body.innerHTML = '<form><input name="tenant" value="demo"><input id="search" type="text"></form>';
    const field = document.querySelector<HTMLInputElement>('#search')!;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 1, name: 'Ada' }])
    });
    vi.stubGlobal('fetch', fetchMock);

    new BootstrapSearch<Person>(field, {
      remoteData: '/users',
      remoteDataHttpMethod: 'POST',
      inputLabel: 'name',
      dropdownLabel: 'name',
      value: 'id',
      threshold: 1
    });

    input(field, 'a');
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe('POST');
    expect(options.body).toBeInstanceOf(FormData);
    expect((options.body as FormData).get('tenant')).toBe('demo');
    expect((options.body as FormData).get('q')).toBe('a');
  });

  it('clear resets selection, value, icon, and expanded state', () => {
    const field = createField();
    const search = new BootstrapSearch<Person>(field, {
      data: [{ id: 1, name: 'Ada' }],
      inputLabel: 'name',
      dropdownLabel: 'name',
      value: 'id'
    });

    input(field, 'ada');
    document.querySelector<HTMLButtonElement>('.dropdown-item')?.click();
    search.clear();

    expect(field.value).toBe('');
    expect(search.selectedItems).toHaveLength(0);
    expect(field.getAttribute('aria-expanded')).toBe('false');
    expect(document.querySelector('.bootstrap-search-icon')).not.toBeNull();
  });
});
