import { DEFAULTS } from './defaults';
import { resolveIcon } from './icons';
import type {
  BootstrapDropdownInstance,
  BootstrapSearchIcons,
  BootstrapSearchOptions,
  BootstrapSearchUserOptions,
  IconState,
  ItemValue,
  LabelResolver,
  SelectedItem,
  ValueResolver
} from './types';
import { appendMarkup, escapeHtml, removeDiacritics, toArray } from './utils';

let instanceId = 0;

export class BootstrapSearch<TItem = Record<string, unknown>> {
  field: HTMLInputElement;
  options: BootstrapSearchOptions<TItem>;
  dropdownDiv: HTMLDivElement;
  statusIcon: HTMLSpanElement;
  dropdown: BootstrapDropdownInstance;
  activeIndex = -1;
  selectedItems: SelectedItem[];

  private controller: AbortController | null = null;
  private updatingValue = false;
  private readonly listboxId: string;
  private readonly itemValues = new WeakMap<HTMLButtonElement, ItemValue>();

  constructor(field: HTMLInputElement, options: BootstrapSearchUserOptions<TItem> = {}) {
    this.field = field;
    this.options = this.mergeOptions(options);
    this.selectedItems = this.options.selectedItems.map((item) => this.toSelectedItem(item));

    if (toArray(this.options.data).length === 0 && this.options.selectedItems.length > 0) {
      this.options.data = [...this.options.selectedItems];
    }

    this.listboxId = `bootstrap-search-listbox-${++instanceId}`;

    field.classList.add('bootstrap-search-field', 'form-control');
    field.setAttribute('role', 'combobox');
    field.setAttribute('aria-autocomplete', 'list');
    field.setAttribute('aria-expanded', 'false');
    field.setAttribute('aria-controls', this.listboxId);

    const wrapper = document.createElement('div');
    wrapper.className = 'position-relative';
    field.parentNode?.insertBefore(wrapper, field);
    wrapper.appendChild(field);

    this.statusIcon = document.createElement('span');
    this.statusIcon.className = 'position-absolute top-50 end-0 translate-middle-y pe-2';
    this.statusIcon.setAttribute('aria-hidden', 'true');
    wrapper.appendChild(this.statusIcon);

    this.dropdownDiv = document.createElement('div');
    this.dropdownDiv.id = this.listboxId;
    this.dropdownDiv.className = 'dropdown-menu w-100';
    this.dropdownDiv.style.maxHeight = '250px';
    this.dropdownDiv.style.overflowY = 'auto';
    this.dropdownDiv.setAttribute('role', 'listbox');

    if (this.options.multiSelect) {
      this.dropdownDiv.setAttribute('aria-multiselectable', 'true');
    }

    if (this.options.dropdownClass) {
      this.dropdownDiv.classList.add(this.options.dropdownClass);
    }

    wrapper.appendChild(this.dropdownDiv);
    this.dropdown = new bootstrap.Dropdown(field, { autoClose: !this.options.multiSelect });

    this.bindEvents();
    this.syncInitialValue();
    this.renderIcon(this.selectedItems.length > 0 || this.field.value ? 'success' : 'search');

    field.bootstrapSearch = this as BootstrapSearch<unknown>;
  }

  clear(): void {
    this.selectedItems = [];
    this.field.value = '';
    this.renderIcon('search');
    this.hideDropdown();
    this.clearActive();
  }

  async fetchData(query: string): Promise<boolean> {
    const lookup = this.getLookup(query);

    if (lookup.length < this.options.threshold) {
      this.controller?.abort();
      this.options.data = [];
      this.dropdownDiv.replaceChildren();
      this.hideDropdown();
      this.renderIcon('search');
      return false;
    }

    this.controller?.abort();
    this.controller = new AbortController();

    try {
      const url = typeof this.options.remoteData === 'function'
        ? this.options.remoteData(encodeURIComponent(lookup))
        : this.options.remoteData;

      if (!url) return false;

      const method = (this.options.remoteDataHttpMethod || 'GET').toUpperCase();
      const fetchOptions: RequestInit = { method, signal: this.controller.signal };

      if (method === 'POST') {
        const formData = new FormData();
        const form = this.field.closest('form');
        if (form) {
          new FormData(form).forEach((value, key) => formData.append(key, value));
        }
        formData.append('q', lookup);
        fetchOptions.body = formData;
      }

      const response = await fetch(url, fetchOptions);
      if (!response.ok) {
        throw new Error(`BootstrapSearch request failed with status ${response.status}`);
      }

      const data = await response.json();
      this.setData(this.options.resolveData(data) as TItem[] | Record<string, TItem>);
      return true;
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error(error);
        this.renderIcon('error');
      }
      return false;
    }
  }

  setData(data: TItem[] | Record<string, TItem>): void {
    this.options.data = data;
    this.renderIfNeeded();
  }

  renderIfNeeded(): void {
    const count = this.createItems();
    if (count > 0) {
      this.showDropdown();
      if (this.selectedItems.length === 0) {
        this.renderIcon('search');
      }
      return;
    }

    this.hideDropdown();
    this.renderIcon('empty');
  }

  private mergeOptions(options: BootstrapSearchUserOptions<TItem>): BootstrapSearchOptions<TItem> {
    return {
      ...(DEFAULTS as BootstrapSearchOptions<TItem>),
      ...options,
      icons: {
        ...DEFAULTS.icons,
        ...(options.icons ?? {})
      } as Required<BootstrapSearchIcons>
    };
  }

  private bindEvents(): void {
    this.field.addEventListener('input', () => this.handleInput());
    this.field.addEventListener('keydown', (event) => this.handleKeydown(event));
    this.field.addEventListener('focus', () => {
      if (toArray(this.options.data).length) {
        this.renderIfNeeded();
      }
    });

    document.addEventListener('click', (event) => {
      if (!this.dropdownDiv.contains(event.target as Node) && event.target !== this.field) {
        this.hideDropdown();
      }
    });
  }

  private handleInput(): void {
    if (this.updatingValue) return;

    this.clearActive();

    if (this.options.multiSelect) {
      const currentValues = this.field.value.split(',').map((value) => value.trim());
      this.selectedItems = this.selectedItems.filter((item) => currentValues.includes(item.label));
      this.options.onSelectItem?.([...this.selectedItems]);
    } else {
      this.selectedItems = [];
      this.options.onSelectItem?.(null);
    }

    this.renderIcon('search');
    this.options.onInput?.(this.field.value);

    if (this.options.remoteData) {
      if (this.getLookup(this.field.value).length >= this.options.threshold) {
        this.renderIcon('loading');
      }
      void this.fetchData(this.field.value);
      return;
    }

    this.renderIfNeeded();
  }

  private handleKeydown(event: KeyboardEvent): void {
    const items = this.getItems();

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!items.length) {
        this.renderIfNeeded();
        return;
      }
      this.activeIndex = (this.activeIndex + 1) % items.length;
      this.updateActive(items);
      return;
    }

    if (event.key === 'ArrowUp') {
      if (!items.length) return;
      event.preventDefault();
      this.activeIndex = (this.activeIndex - 1 + items.length) % items.length;
      this.updateActive(items);
      return;
    }

    if (event.key === 'Home' && items.length && this.isExpanded()) {
      event.preventDefault();
      this.activeIndex = 0;
      this.updateActive(items);
      return;
    }

    if (event.key === 'End' && items.length && this.isExpanded()) {
      event.preventDefault();
      this.activeIndex = items.length - 1;
      this.updateActive(items);
      return;
    }

    if (event.key === 'Enter') {
      if (this.activeIndex >= 0 && items[this.activeIndex]) {
        event.preventDefault();
        items[this.activeIndex].click();
      }
      return;
    }

    if (event.key === 'Escape') {
      this.hideDropdown();
      this.clearActive();
      return;
    }

    if (event.key === 'Tab') {
      this.hideDropdown();
      this.clearActive();
    }
  }

  private createItem(lookup: string | null, item: TItem, index: number): HTMLButtonElement {
    const labelHtml = this.createLabelHtml(lookup, item);
    const dataValue = this.getValue(item);
    const dataLabel = this.getLabel(this.options.inputLabel, item);
    const optionId = `${this.listboxId}-option-${index}`;

    const button = document.createElement('button');
    button.id = optionId;
    button.type = 'button';
    button.className = 'dropdown-item d-flex justify-content-between align-items-center';
    button.setAttribute('role', 'option');
    button.setAttribute('data-label', dataLabel);
    button.setAttribute('data-value', String(dataValue));
    button.setAttribute('aria-selected', String(this.isSelected(dataValue)));
    button.innerHTML = labelHtml;
    this.itemValues.set(button, dataValue);

    if (this.isSelected(dataValue)) {
      const icon = document.createElement('span');
      icon.className = 'bootstrap-search-selected-icon';
      appendMarkup(icon, resolveIcon(this.options.icons as Required<BootstrapSearchIcons>, 'selected', this.field));
      button.appendChild(icon);
    }

    button.addEventListener('click', (event) => this.onItemSelected(event));
    return button;
  }

  private createItems(): number {
    this.dropdownDiv.replaceChildren();
    const dataArray = toArray(this.options.data);
    let count = 0;
    let index = 0;

    for (const entry of dataArray) {
      const lookup = this.options.multiSelect ? this.getLookup(this.field.value) : this.field.value;
      const itemLabel = this.getLabel(this.options.dropdownLabel, entry);
      if (removeDiacritics(itemLabel).toLowerCase().includes(removeDiacritics(lookup).toLowerCase())) {
        this.dropdownDiv.appendChild(this.createItem(lookup || null, entry, index++));
        count++;
        if (this.options.maximumItems > 0 && count >= this.options.maximumItems) {
          break;
        }
      }
    }

    if (count > 0) {
      this.showDropdown();
    } else {
      this.hideDropdown();
    }

    return count;
  }

  private createLabelHtml(lookup: string | null, item: TItem): string {
    const dropdownLabel = this.options.dropdownLabel;
    const isCustomHtml = typeof dropdownLabel === 'function';
    const rawLabel = this.getLabel(dropdownLabel, item);
    let labelHtml = isCustomHtml ? rawLabel : escapeHtml(rawLabel);

    if (this.options.highlightTyped && lookup && !isCustomHtml) {
      const plainLabel = removeDiacritics(rawLabel).toLowerCase();
      const search = removeDiacritics(lookup).toLowerCase();
      const index = plainLabel.indexOf(search);
      const className = Array.isArray(this.options.highlightClass)
        ? this.options.highlightClass.join(' ')
        : this.options.highlightClass;

      if (index >= 0) {
        labelHtml = `${escapeHtml(rawLabel.substring(0, index))}<span class="${escapeHtml(className)}">${escapeHtml(rawLabel.substring(index, index + lookup.length))}</span>${escapeHtml(rawLabel.substring(index + lookup.length))}`;
      }
    }

    if (!isCustomHtml) {
      labelHtml = `<div>${labelHtml}</div>`;
    }

    if (this.options.showValue) {
      const safeValue = escapeHtml(this.getValue(item));
      labelHtml = this.options.showValueBeforeLabel ? `${safeValue} ${labelHtml}` : `${labelHtml} ${safeValue}`;
    }

    return labelHtml;
  }

  private onItemSelected(event: Event): void {
    const target = event.currentTarget as HTMLButtonElement;
    const dataLabel = target.getAttribute('data-label') ?? '';
    const dataValue = this.itemValues.get(target) ?? target.getAttribute('data-value') ?? '';

    if (this.options.multiSelect) {
      const exists = this.selectedItems.find((item) => String(item.value) === String(dataValue));
      if (!exists) {
        this.selectedItems.push({ value: dataValue, label: dataLabel });
      } else {
        this.selectedItems = this.selectedItems.filter((item) => String(item.value) !== String(dataValue));
      }

      this.updatingValue = true;
      this.field.value = this.selectedItems.map((item) => item.label).join(', ');
      this.updatingValue = false;

      this.renderIfNeeded();
      this.renderIcon(this.selectedItems.length ? 'success' : 'search');
      this.options.onSelectItem?.([...this.selectedItems]);
      return;
    }

    this.selectedItems = [{ value: dataValue, label: dataLabel }];
    this.field.value = dataLabel;
    this.hideDropdown();
    this.clearActive();
    this.renderIcon('success');
    this.options.onSelectItem?.(this.selectedItems[0]);
  }

  private updateActive(items: HTMLButtonElement[]): void {
    items.forEach((item, index) => {
      const active = index === this.activeIndex;
      item.classList.toggle('active', active);
      if (active) {
        item.scrollIntoView({ block: 'nearest' });
        this.field.setAttribute('aria-activedescendant', item.id);
      }
    });
  }

  private clearActive(): void {
    this.activeIndex = -1;
    this.getItems().forEach((item) => item.classList.remove('active'));
    this.field.removeAttribute('aria-activedescendant');
  }

  private getItems(): HTMLButtonElement[] {
    return Array.from(this.dropdownDiv.querySelectorAll<HTMLButtonElement>('.dropdown-item'));
  }

  private showDropdown(): void {
    this.dropdown.show();
    this.field.setAttribute('aria-expanded', 'true');
  }

  private hideDropdown(): void {
    this.dropdown.hide();
    this.field.setAttribute('aria-expanded', 'false');
  }

  private isExpanded(): boolean {
    return this.field.getAttribute('aria-expanded') === 'true';
  }

  private renderIcon(state: IconState): void {
    appendMarkup(this.statusIcon, resolveIcon(this.options.icons as Required<BootstrapSearchIcons>, state, this.field));
  }

  private syncInitialValue(): void {
    if (!this.selectedItems.length) return;

    this.updatingValue = true;
    this.field.value = this.options.multiSelect
      ? this.selectedItems.map((item) => item.label).join(', ')
      : this.selectedItems[0].label;
    this.updatingValue = false;
  }

  private getLookup(query: string): string {
    if (!this.options.multiSelect) return query;
    const parts = query.split(',');
    return parts[parts.length - 1].trim();
  }

  private getLabel(resolver: LabelResolver<TItem>, item: TItem): string {
    if (typeof resolver === 'function') return resolver(item);
    const key = String(resolver);
    return String((item as Record<string, unknown>)[key] ?? (item as Record<string, unknown>).label ?? '');
  }

  private getValue(item: TItem): ItemValue {
    const resolver = this.options.value as ValueResolver<TItem>;
    if (typeof resolver === 'function') return resolver(item);
    const key = String(resolver);
    const value = (item as Record<string, unknown>)[key] ?? (item as Record<string, unknown>).value ?? '';
    return typeof value === 'number' ? value : String(value);
  }

  private toSelectedItem(item: TItem): SelectedItem {
    return {
      value: this.getValue(item),
      label: this.getLabel(this.options.inputLabel, item)
    };
  }

  private isSelected(value: ItemValue): boolean {
    return this.selectedItems.some((item) => String(item.value) === String(value));
  }
}
