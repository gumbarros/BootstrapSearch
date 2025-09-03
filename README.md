
<div class="d-flex justify-content-center align-items-center mb-5">
    <img src="public/logo.png" class="img-responsive" style="width: 150px" alt="BootstrapSearch Logo">
    <h1>BootstrapSearch</h1>
</div>

**BootstrapSearch** is a fork of [bootstrap-5-autocomplete](https://github.com/gch1p/bootstrap-5-autocomplete) that enhances the functionality with AJAX support, customizable label/value mapping, loading and success indicators, keyboard navigation, and multi-select capabilities.

---

## Features

* AJAX support for dynamic data fetching
* Local data support
* Multi-select with tags
* Customizable dropdown and input labels (supports HTML)
* Keyboard navigation
* Highlight typed text in dropdown

---

## Installation

Include Bootstrap 5.3 and FontAwesome in your project, then include `bootstrap-search.js`:

```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script src="path/to/bootstrap-search.js"></script>
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

---

### AJAX Search

```html
<input type="text" id="example1" placeholder="Type a user name..." autocomplete="off">
```

```js
new BootstrapSearch(document.getElementById('example1'), {
    ajax: q => `https://dummyjson.com/users/search?q=${q}`,
    inputLabel: 'firstName',
    dropdownLabel: 'firstName',
    value: 'id',
    resolveData: res => res.users,
    onSelectItem: item => console.log('Selected:', item)
});
```

---

### Custom Dropdown Label

```html
<input type="text" id="example2" placeholder="Type a user..." autocomplete="off">
```

```js
new BootstrapSearch(document.getElementById('example2'), {
    ajax: q => `https://dummyjson.com/users/search?q=${q}`,
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

---

### Multi-Select

```html
<input type="text" id="example4" placeholder="Select users..." autocomplete="off">
```

```js
new BootstrapSearch(document.getElementById('example4'), {
    ajax: q => `https://dummyjson.com/users/search?q=${q}`,
    inputLabel: 'firstName',
    dropdownLabel: 'firstName',
    value: 'id',
    resolveData: res => res.users,
    multiSelect: true,
    onSelectItem: items => console.log('Selected Items:', items)
});
```
## API Reference

| Option               | Description                                                  | Default        |
| -------------------- | ------------------------------------------------------------ | -------------- |
| threshold            | Number of characters before searching                        | 2              |
| highlightTyped       | Highlight typed text in dropdown                             | true           |
| highlightClass       | CSS class(es) for highlight                                  | 'text-primary' |
| inputLabel           | String key or lambda to set `input.value` when item selected | 'label'        |
| dropdownLabel        | String key or lambda to render dropdown item (supports HTML) | 'label'        |
| value                | String key or lambda to get value                            | 'value'        |
| showValue            | Show value alongside label in dropdown                       | false          |
| showValueBeforeLabel | Show value before label in dropdown                          | false          |
| ajax                 | URL string or lambda returning URL for AJAX request          | -              |
| resolveData          | Lambda to transform AJAX response                            | -              |
| onInput              | Callback on input change                                     | -              |
| onSelectItem         | Callback when user selects an item                           | -              |
| multiSelect          | Allow selecting multiple items with tags                     | false          |


## TODO
Help contributing to the library with these missing things:
- Remove FontAwesome dependency by parametrizing icons
- Migrate the codebase to TypeScript for type safety
- Add a build system with support for CDNs and module bundlers
- Extend accessibility and keyboard navigation
- Add unit tests and continuous integration