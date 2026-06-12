<div class="d-flex justify-content-center align-items-center mb-5">
    <img src="public/logo.png" class="img-responsive" style="width: 150px" alt="BootstrapSearch Logo">
    <h1>BootstrapSearch</h1>
</div>

**BootstrapSearch** is a Bootstrap 5 autocomplete and multi-select search component with AJAX support, customizable label/value mapping, typed package builds, keyboard navigation, and configurable icons.

---

## Features

* AJAX support for dynamic data fetching
* Local data support
* Multi-select
* Customizable dropdown and input labels
* Configurable status and selected-item icons
* Keyboard navigation and combobox/listbox ARIA attributes
* TypeScript types
* CDN, ESM, and CommonJS builds
* Unit tests and CI

---

## Installation

### CDN / Browser Global

Include Bootstrap 5.3 and the BootstrapSearch browser bundle. FontAwesome is not required.

```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap-search/dist/bootstrap-search.iife.js"></script>
```

```js
new BootstrapSearch(document.getElementById('search'), {
    data: [{ id: 1, name: 'Ada Lovelace' }],
    inputLabel: 'name',
    dropdownLabel: 'name',
    value: 'id'
});
```

### Module Bundlers

```bash
npm install bootstrap-search bootstrap
```

```ts
import BootstrapSearch from 'bootstrap-search';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

type User = {
    id: number;
    firstName: string;
    lastName: string;
};

new BootstrapSearch<User>(document.querySelector<HTMLInputElement>('#search')!, {
    remoteData: q => `/api/users?q=${q}`,
    inputLabel: user => `${user.firstName} ${user.lastName}`,
    dropdownLabel: 'firstName',
    value: 'id'
});
```

---

## Examples

### Local Data

```html
<input type="text" id="example3" placeholder="Select a dish..." autocomplete="off">
```

```js
const foods = [
    { id: 1, name: "Empanadas", country: "Argentina" },
    { id: 2, name: "Pastel de Nata", country: "Portugal" },
    { id: 3, name: "Pulpo a la Gallega", country: "Spain" },
    { id: 4, name: "Completo", country: "Chile" },
    { id: 5, name: "Tacos al Pastor", country: "Mexico" },
    { id: 6, name: "Tapioca", country: "Brazil" }
];

new BootstrapSearch(document.getElementById('example3'), {
    data: foods,
    inputLabel: 'name',
    dropdownLabel: 'name',
    value: 'country',
    onSelectItem: item => console.log('Selected Local:', item)
});
```

### AJAX Search

```html
<input type="text" id="example1" placeholder="Type a user name..." autocomplete="off">
```

```js
new BootstrapSearch(document.getElementById('example1'), {
    remoteData: q => `https://dummyjson.com/users/search?q=${q}`,
    inputLabel: 'firstName',
    dropdownLabel: 'firstName',
    value: 'id',
    resolveData: res => res.users,
    onSelectItem: item => console.log('Selected:', item)
});
```

### Custom Dropdown Label

```html
<input type="text" id="example2" placeholder="Type a user..." autocomplete="off">
```

```js
new BootstrapSearch(document.getElementById('example2'), {
    remoteData: q => `https://dummyjson.com/users/search?q=${q}`,
    inputLabel: item => `${item.firstName} ${item.lastName}`,
    dropdownLabel: item => {
        const imgUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${item.id}`;
        return `<div class="avatar-label"><img src="${imgUrl}" alt="avatar"/>${item.firstName} ${item.lastName}</div>`;
    },
    value: item => item.id,
    resolveData: res => res.users,
    onSelectItem: item => console.log('Selected User:', item)
});
```

### Multi-Select

```html
<input type="text" id="example4" placeholder="Select users..." autocomplete="off">
```

```js
new BootstrapSearch(document.getElementById('example4'), {
    remoteData: q => `https://dummyjson.com/users/search?q=${q}`,
    inputLabel: 'firstName',
    dropdownLabel: 'firstName',
    value: 'id',
    resolveData: res => res.users,
    multiSelect: true,
    onSelectItem: items => console.log('Selected Items:', items)
});
```

### Custom Icons

```js
new BootstrapSearch(document.getElementById('example5'), {
    data: foods,
    inputLabel: 'name',
    dropdownLabel: 'name',
    value: 'id',
    icons: {
        search: '<span class="bi bi-search"></span>',
        success: '<span class="bi bi-check-lg text-success"></span>',
        empty: null,
        selected: ({ state }) => `<span class="badge text-bg-primary">${state}</span>`
    }
});
```

---

## Keyboard And Accessibility

BootstrapSearch renders the input as a combobox and the dropdown as a listbox.

| Key | Behavior |
| --- | --- |
| ArrowDown | Opens the menu when needed and moves to the next option |
| ArrowUp | Moves to the previous option |
| Home | Moves to the first option when the menu is open |
| End | Moves to the last option when the menu is open |
| Enter | Selects the active option |
| Escape | Closes the menu |
| Tab | Closes the menu and allows normal focus movement |

---

## API Reference

| Option | Description | Default |
| --- | --- | --- |
| threshold | Number of characters before remote searching | 2 |
| maximumItems | Maximum local items to render, or `0` for no limit | 5 |
| highlightTyped | Highlight typed text in dropdown | true |
| highlightClass | CSS class(es) for highlight | `'text-primary'` |
| inputLabel | String key or function to set `input.value` when item selected | `'label'` |
| dropdownLabel | String key or function to render dropdown item. Function output is treated as HTML. | `'label'` |
| value | String key or function to get selected value | `'value'` |
| showValue | Show value alongside label in dropdown | false |
| showValueBeforeLabel | Show value before label in dropdown | false |
| remoteData | URL string or function returning URL for AJAX request | `null` |
| remoteDataHttpMethod | HTTP method for remote data | `'GET'` |
| data | Local data array or object map | `[]` |
| resolveData | Function to transform AJAX response | `response => response` |
| onInput | Callback on input change | `null` |
| onSelectItem | Callback when user selects an item | `null` |
| multiSelect | Allow selecting multiple items | false |
| dropdownClass | Extra class for the dropdown menu | `''` |
| selectedItems | Initial selected items | `[]` |
| icons | Status and selected-item icon renderers | inline SVG defaults |

## Development

```bash
npm install
npm run check
npm test
npm run build
```

Use `npm run build:demo` to rebuild the browser bundle used by the static demo in `public/`.

## Special Thanks

Thanks to [@gch1p](https://github.com/gch1p) for the original library, without it, this would have been impossible :)
