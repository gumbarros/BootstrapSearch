import { DEFAULT_ICONS } from './icons';
import type { BootstrapSearchOptions } from './types';

export const DEFAULTS: BootstrapSearchOptions = {
  threshold: 2,
  maximumItems: 5,
  highlightTyped: true,
  highlightClass: 'text-primary',
  inputLabel: 'label',
  dropdownLabel: 'label',
  value: 'value',
  showValue: false,
  showValueBeforeLabel: false,
  remoteData: null,
  remoteDataHttpMethod: 'GET',
  data: [],
  resolveData: (response) => response as Record<string, unknown>[],
  onInput: null,
  onSelectItem: null,
  multiSelect: false,
  dropdownClass: '',
  selectedItems: [],
  icons: DEFAULT_ICONS
};
