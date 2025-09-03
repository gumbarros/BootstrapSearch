const DEFAULTS = {
    threshold: 2,
    maximumItems: 5,
    highlightTyped: true,
    highlightClass: 'text-primary',
    inputLabel: 'label',
    dropdownLabel: 'label',
    value: 'value',
    showValue: false,
    showValueBeforeLabel: false,
    ajax: null,
    resolveData: (response) => response,
    onInput: null,
    onSelectItem: null,
    multiSelect: false,
    dropdownClass: ''
};

class BootstrapSearch {
    constructor(field, options) {
        this.field = field;
        this.options = Object.assign({}, DEFAULTS, options);
        this.dropdown = null;
        this.controller = null;
        this.activeIndex = -1;
        this.selectedItems = [];
        this._updatingValue = false;

        field.classList.add('bootstrap-search-field', 'form-control');

        const wrapper = document.createElement('div');
        wrapper.className = 'position-relative';
        field.parentNode.insertBefore(wrapper, field);
        wrapper.appendChild(field);

        this.statusIcon = document.createElement('span');
        this.statusIcon.className = 'position-absolute top-50 end-0 translate-middle-y pe-2';
        wrapper.appendChild(this.statusIcon);

        this.setDefaultIcon();

        const dropdownDiv = document.createElement('div');
        dropdownDiv.className = 'dropdown-menu w-100';
        if (this.options.dropdownClass) dropdownDiv.classList.add(this.options.dropdownClass);
        wrapper.appendChild(dropdownDiv);
        this.dropdownDiv = dropdownDiv;

        this.dropdown = new bootstrap.Dropdown(field, {
            autoClose: this.options.multiSelect ? false : true
        });

        this.field.addEventListener('input', () => {
            if (this._updatingValue) return;

            this.activeIndex = -1;

            if (this.selectedItems.length) {
                this.selectedItems = [];
                if (this.options.multiSelect) {
                    this.options.onSelectItem && this.options.onSelectItem([]);
                } else {
                    this.options.onSelectItem && this.options.onSelectItem(null);
                }
            }

            this.clearStatus();
            this.setDefaultIcon();

            this.dropdownDiv.querySelectorAll('.dropdown-item i.fas.fa-check').forEach(icon => icon.remove());

            if (this.options.onInput) this.options.onInput(this.field.value);

            if (this.options.ajax) {
                if (this.field.value.length >= this.options.threshold) this.showLoading();
                this.fetchData(this.field.value);
            } else {
                this.renderIfNeeded();
            }
        });


        field.addEventListener('keydown', (e) => this.handleKeydown(e));

        document.addEventListener('click', (e) => {
            if (!this.dropdownDiv.contains(e.target) && e.target !== this.field) {
                this.dropdown.hide();
            }
        });
    }

    handleKeydown(e) {
        const items = Array.from(this.dropdownDiv.querySelectorAll('.dropdown-item'));
        if (!items.length) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.activeIndex = (this.activeIndex + 1) % items.length;
            this.updateActive(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.activeIndex = (this.activeIndex - 1 + items.length) % items.length;
            this.updateActive(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.activeIndex >= 0 && items[this.activeIndex]) items[this.activeIndex].click();
        } else if (e.key === 'Escape') {
            this.dropdown.hide();
        }
    }

    updateActive(items) {
        items.forEach((item, i) => {
            if (i === this.activeIndex) {
                item.classList.add('active');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('active');
            }
        });
    }

    setDefaultIcon() {
        this.statusIcon.innerHTML = `<i class="fas fa-search text-secondary"></i>`;
    }

    showLoading() {
        this.statusIcon.innerHTML = `<div class="spinner-border spinner-border-sm text-secondary" role="status"><span class="visually-hidden">Loading...</span></div>`;
    }

    showSuccess() {
        this.statusIcon.innerHTML = `<i class="fas fa-check text-success"></i>`;
    }

    clearStatus() {
        this.statusIcon.innerHTML = '';
    }

    async fetchData(query) {
        if (query.length < this.options.threshold) {
            this.clearStatus();
            this.setDefaultIcon();
            return;
        }
        if (this.controller) this.controller.abort();
        this.controller = new AbortController();
        try {
            const url = typeof this.options.ajax === 'function' ? this.options.ajax(query) : this.options.ajax;
            const response = await fetch(url, { signal: this.controller.signal });
            const data = await response.json();
            this.setData(this.options.resolveData(data));
        } catch (err) {
            if (err.name !== 'AbortError') console.error(err);
        } finally {
            this.clearStatus();
            if (!this.selectedItems.length) this.setDefaultIcon();
        }
    }

    setData(data) {
        this.options.data = data;
        this.renderIfNeeded();
    }

    renderIfNeeded() {
        if (this.createItems() > 0){
          this.dropdown.show();
        }
        else{
          this.dropdown.hide();
        } 
    }

    createItem(lookup, item) {
        function escapeHtml(str) {
            return String(str)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
        }

        let labelHtml;
        const itemLabel = typeof this.options.dropdownLabel === 'function'
            ? this.options.dropdownLabel(item)
            : escapeHtml(typeof this.options.dropdownLabel === 'string' ? item[this.options.dropdownLabel] ?? '' : item.label ?? '');

        if (this.options.highlightTyped && lookup) {
            const plainLabel = removeDiacritics(itemLabel).toLowerCase();
            const search = removeDiacritics(lookup).toLowerCase();
            const idx = plainLabel.indexOf(search);
            const className = Array.isArray(this.options.highlightClass) ? this.options.highlightClass.join(' ') : this.options.highlightClass;

            if (idx >= 0 && typeof this.options.dropdownLabel !== 'function') {
                labelHtml = itemLabel.substring(0, idx) +
                            `<span class="${escapeHtml(className)}">${escapeHtml(itemLabel.substring(idx, idx + lookup.length))}</span>` +
                            escapeHtml(itemLabel.substring(idx + lookup.length));
            } else {
                labelHtml = itemLabel;
            }
        } else {
            labelHtml = itemLabel;
        }

        if (this.options.showValue) {
            const val = typeof this.options.value === 'function'
                ? this.options.value(item)
                : typeof this.options.value === 'string'
                    ? item[this.options.value] ?? ''
                    : item.value ?? '';
            const safeVal = escapeHtml(val);
            labelHtml = this.options.showValueBeforeLabel ? `${safeVal} ${labelHtml}` : `${labelHtml} ${safeVal}`;
        }

        const dataValue = typeof this.options.value === 'function'
            ? this.options.value(item)
            : typeof this.options.value === 'string'
                ? item[this.options.value] ?? ''
                : item.value ?? '';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dropdown-item';
        btn.setAttribute('data-label', escapeHtml(typeof this.options.inputLabel === 'function' ? this.options.inputLabel(item) : item[this.options.inputLabel] ?? ''));
        btn.setAttribute('data-value', dataValue);
        btn.innerHTML = labelHtml;

        if (this.options.multiSelect && this.selectedItems.find(si => si.value == dataValue)) {
            btn.innerHTML += ' <i class="fas fa-check text-success"></i>';
        }

        return btn;
    }


    createItems() {
        const dropdownDiv = this.dropdownDiv;
        dropdownDiv.innerHTML = '';
        if (!this.options.data) return 0;

        const dataArray = Array.isArray(this.options.data) ? this.options.data : Object.values(this.options.data);
        let count = 0;

        for (let entry of dataArray) {
            if (this.options.multiSelect) {
                dropdownDiv.appendChild(this.createItem(null, entry));
            } else {
                const lookup = this.field.value;
                const itemLabel = typeof this.options.dropdownLabel === 'function'
                    ? this.options.dropdownLabel(entry)
                    : typeof this.options.dropdownLabel === 'string'
                        ? entry[this.options.dropdownLabel] ?? ''
                        : entry.label ?? '';

                if (removeDiacritics(itemLabel).toLowerCase().includes(removeDiacritics(lookup).toLowerCase())) {
                    dropdownDiv.appendChild(this.createItem(lookup, entry));
                    if (this.options.maximumItems > 0 && ++count >= this.options.maximumItems) break;
                }
            }
        }

        const items = dropdownDiv.querySelectorAll('.dropdown-item');
        items.forEach(itemEl => {
            itemEl.addEventListener('click', e => {
                e.stopPropagation();

                const dataLabel = e.currentTarget.getAttribute('data-label');
                const dataValue = e.currentTarget.getAttribute('data-value');

                if (this.options.multiSelect) {
                    const exists = this.selectedItems.find(si => si.value == dataValue);
                    if (!exists) {
                        this.selectedItems.push({ value: dataValue, label: dataLabel });
                    } else {
                        this.selectedItems = this.selectedItems.filter(si => si.value != dataValue);
                    }

                    this._updatingValue = true;
                    this.field.value = this.selectedItems.map(si => si.label).join(', ');
                    this._updatingValue = false;

                    this.renderIfNeeded();
                    if (this.selectedItems.length) this.showSuccess();
                    else this.setDefaultIcon();
                    if (this.options.onSelectItem) this.options.onSelectItem([...this.selectedItems]);
                } else {
                    this.selectedItems = [{ value: dataValue, label: dataLabel }];
                    this.field.value = dataLabel;
                    this.dropdown.hide();
                    this.showSuccess();
                    if (this.options.onSelectItem) this.options.onSelectItem(this.selectedItems[0]);
                }
            });
        });

        if (items.length > 0){
          this.dropdown.show();
        } else {
          this.dropdown.hide();
        }

        return items.length;
    }
}

function removeDiacritics(str) {
    return str?.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
