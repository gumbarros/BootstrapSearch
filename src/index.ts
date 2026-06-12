import { BootstrapSearch } from './bootstrap-search';

export { BootstrapSearch };
export type {
  BootstrapSearchIcons,
  BootstrapSearchOptions,
  BootstrapSearchUserOptions,
  IconContext,
  IconRenderer,
  IconState,
  ItemValue,
  LabelResolver,
  SelectedItem,
  ValueResolver
} from './types';

if (typeof window !== 'undefined') {
  window.BootstrapSearch = BootstrapSearch;
}

export default BootstrapSearch;
