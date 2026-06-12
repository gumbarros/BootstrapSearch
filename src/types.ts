export type ItemValue = string | number;

export type LabelResolver<TItem> = keyof TItem | string | ((item: TItem) => string);

export type ValueResolver<TItem> = keyof TItem | string | ((item: TItem) => ItemValue);

export interface SelectedItem {
  value: ItemValue;
  label: string;
}

export type IconContext = {
  field: HTMLInputElement;
  state: IconState;
};

export type IconRenderer = string | HTMLElement | null | ((context: IconContext) => string | HTMLElement | null);

export type IconState = 'search' | 'loading' | 'success' | 'empty' | 'error' | 'selected';

export type BootstrapSearchIcons = Partial<Record<IconState, IconRenderer>>;

export interface BootstrapSearchOptions<TItem = Record<string, unknown>> {
  threshold: number;
  maximumItems: number;
  highlightTyped: boolean;
  highlightClass: string | string[];
  inputLabel: LabelResolver<TItem>;
  dropdownLabel: LabelResolver<TItem>;
  value: ValueResolver<TItem>;
  showValue: boolean;
  showValueBeforeLabel: boolean;
  remoteData: string | ((query: string) => string) | null;
  remoteDataHttpMethod: 'GET' | 'POST' | string;
  data: TItem[] | Record<string, TItem>;
  resolveData: (response: unknown) => TItem[] | Record<string, TItem>;
  onInput: ((value: string) => void) | null;
  onSelectItem: ((item: SelectedItem | SelectedItem[] | null) => void) | null;
  multiSelect: boolean;
  dropdownClass: string;
  selectedItems: TItem[];
  icons: BootstrapSearchIcons;
}

export type BootstrapSearchUserOptions<TItem = Record<string, unknown>> = Partial<BootstrapSearchOptions<TItem>>;

export interface BootstrapDropdownInstance {
  show(): void;
  hide(): void;
}

export interface BootstrapDropdownConstructor {
  new (element: Element, options?: { autoClose?: boolean }): BootstrapDropdownInstance;
}

declare global {
  interface Window {
    BootstrapSearch: typeof import('./bootstrap-search').BootstrapSearch;
    bootstrap?: {
      Dropdown: BootstrapDropdownConstructor;
    };
  }

  interface HTMLInputElement {
    bootstrapSearch?: import('./bootstrap-search').BootstrapSearch<unknown>;
  }

  const bootstrap: {
    Dropdown: BootstrapDropdownConstructor;
  };
}
