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
    remoteData: null,
    remoteDataHttpMethod: 'GET',
    data: [],
    resolveData: (response) => response,
    onInput: null,
    onSelectItem: null,
    multiSelect: false,
    dropdownClass: '',
    selectedItems: []
};

class BootstrapSearch {
    constructor(field, options) {
        this.field = field;
        this.options = Object.assign({}, DEFAULTS, options);
        this.dropdown = null;
        this.controller = null;
        this.activeIndex = -1;
        this.selectedItems = (this.options.selectedItems || []).map(item => ({
            value: typeof this.options.value === 'function' ? this.options.value(item) :
                typeof this.options.value === 'string' ? item[this.options.value] ?? '' : item.value ?? '',
            label: typeof this.options.inputLabel === 'function' ? this.options.inputLabel(item) :
                typeof this.options.inputLabel === 'string' ? item[this.options.inputLabel] ?? '' : item.label ?? ''
        }));
        
        if(this.options.data.length === 0)
            this.options.data = [...this.options.selectedItems];

        this._updatingValue = false;

        field.classList.add('bootstrap-search-field', 'form-control');

        const wrapper = document.createElement('div');
        wrapper.className = 'position-relative';
        field.parentNode.insertBefore(wrapper, field);
        wrapper.appendChild(field);

        this.statusIcon = document.createElement('span');
        this.statusIcon.className = 'position-absolute top-50 end-0 translate-middle-y pe-2';
        wrapper.appendChild(this.statusIcon);
        
        if(this.selectedItems.length > 0 || this.field.value) {
            this.showSuccess();
        }
        else{
            this.setDefaultIcon();
        }
        
        const dropdownDiv = document.createElement('div');
        dropdownDiv.className = 'dropdown-menu w-100';
        dropdownDiv.style.maxHeight = '250px';
        dropdownDiv.style.overflowY = 'auto';

        if (this.options.dropdownClass) 
            dropdownDiv.classList.add(this.options.dropdownClass);

        wrapper.appendChild(dropdownDiv);
        this.dropdownDiv = dropdownDiv;

        this.dropdown = new bootstrap.Dropdown(field, {
            autoClose: !this.options.multiSelect
        });

        this.field.addEventListener('input', () => {
            if (this._updatingValue) return;

            this.activeIndex = -1;

            if (this.options.multiSelect) {
                const currentValues = this.field.value.split(',').map(v => v.trim());
                this.selectedItems = this.selectedItems.filter(si => currentValues.includes(si.label));
                this.options.onSelectItem && this.options.onSelectItem([...this.selectedItems]);

                this.options.onSelectItem && this.options.onSelectItem([]);
            }
            else{
                this.selectedItems = [];
                this.options.onSelectItem && this.options.onSelectItem(null);
            }
            
            this.clearStatus();
            this.setDefaultIcon();

            this.dropdownDiv.querySelectorAll('.dropdown-item i.fas.fa-check').forEach(icon => icon.remove());

            if (this.options.onInput) 
                this.options.onInput(this.field.value);

            if (this.options.remoteData) {
                if (this.field.value.length >= this.options.threshold) this.showLoading();
                this.fetchData(this.field.value).then(_=>this.renderIfNeeded());
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

        field.addEventListener('focus', () => {
            if (this.options.data && this.options.data.length) {
                this.renderIfNeeded();
                this.dropdown.show();
            }
        });

        if (this.selectedItems.length > 0) {
            this._updatingValue = true;
            this.field.value = this.options.multiSelect
                ? this.selectedItems.map(si => si.label).join(', ')
                : this.selectedItems[0].label;
            this._updatingValue = false;
        }

        field.bootstrapSearch = this;
    }

    clear(){
        this.selectedItems = [];
        this.field.value = ''
        this.setDefaultIcon();
        this.dropdown.hide();
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
        this.statusIcon.innerHTML = `<i class="fas fa-search"></i>`;
    }

    showLoading() {
        this.statusIcon.innerHTML = `<div class="spinner-border spinner-border-sm text-secondary" role="status"><span class="visually-hidden">Loading...</span></div>`;
    }

    showSuccess() {
        this.statusIcon.innerHTML = `<i class="fas fa-check"></i>`;
    }

    showNoResults() {
        this.statusIcon.innerHTML = `<i class="fas fa-times"></i>`;
    }

    showError() {
        this.statusIcon.innerHTML = `<i class="fas fa-times text-danger"></i>`;
    }

    clearStatus() {
        this.statusIcon.innerHTML = '';
    }

    async fetchData(query) {
        if (this.options.multiSelect) {
            const parts = query.split(',');
            query = parts[parts.length - 1].trim();
        }
        if (query.length < this.options.threshold) {
            this.clearStatus();
            this.setDefaultIcon();
            return;
        }
        if (this.controller) this.controller.abort();
        this.controller = new AbortController();
        try {
            const method = (this.options.remoteDataHttpMethod || 'GET').toUpperCase();

            let fetchOptions = { method, signal: this.controller.signal };

            if (method === 'POST') {
                let formData = new FormData();
                const form = this.field.closest('form');
                if (form) {
                    new FormData(form).forEach((v, k) => formData.append(k, v));
                }
                formData.append('q', query);
                fetchOptions.body = formData;
            }

            const response = await fetch(url, fetchOptions);
            const data = await response.json();
            this.setData(this.options.resolveData(data));
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error(err);
                this.showError();
            }
        } finally {
            if (!this.selectedItems.length)
                this.setDefaultIcon();
        }
    }

    setData(data) {
        this.options.data = data;
        this.renderIfNeeded();
    }

    renderIfNeeded() {
        const count = this.createItems();
        if (count > 0) {
            this.dropdown.show();

            if(this.selectedItems.length == 0){
                this.setDefaultIcon();
            }
        } else {
            this.dropdown.hide();
            this.showNoResults();
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
      let itemLabel;

        if (typeof this.options.dropdownLabel === 'function') {
            itemLabel = this.options.dropdownLabel(item);
        } 
        else {
            if (typeof this.options.dropdownLabel === 'string') {
                itemLabel = escapeHtml(item[this.options.dropdownLabel] ?? '');
            } else {
                itemLabel = escapeHtml(item.label ?? '');
            }
        }


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

        if (typeof this.options.dropdownLabel !== 'function') {
            labelHtml = `<div>${labelHtml}</div>`;
        }

        if (this.options.showValue) {
            let val;

            if (typeof this.options.value === 'function') {
                val = this.options.value(item);
            } else if (typeof this.options.value === 'string') {
                val = item[this.options.value] ?? '';
            } else {
                val = item.value ?? '';
            }

            const safeVal = escapeHtml(val);
            if (this.options.showValueBeforeLabel) {
                labelHtml = `${safeVal} ${labelHtml}`;
            } else {
                labelHtml = `${labelHtml} ${safeVal}`;
            }
        }

        let dataValue;

        if (typeof this.options.value === 'function') {
            dataValue = this.options.value(item);
        } else if (typeof this.options.value === 'string') {
            dataValue = item[this.options.value] ?? '';
        } else {
            dataValue = item.value ?? '';
        }


        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dropdown-item d-flex justify-content-between align-items-center';
        btn.setAttribute('data-label', escapeHtml(typeof this.options.inputLabel === 'function' ? this.options.inputLabel(item) : item[this.options.inputLabel] ?? ''));
        btn.setAttribute('data-value', dataValue);
        btn.innerHTML = labelHtml;

        if (this.selectedItems.find(si => si.value == dataValue)) {
            btn.innerHTML += ' <i class="fas fa-check fa-lg"></i>';
        }

        return btn;
    }

    createItems() {
        const dropdownDiv = this.dropdownDiv;
        dropdownDiv.innerHTML = '';
        if (!this.options.data) 
            return 0;

        const dataArray = Array.isArray(this.options.data) ? this.options.data : Object.values(this.options.data);
        let count = 0;

        for (let entry of dataArray) {
            if (this.options.multiSelect) {
                dropdownDiv.appendChild(this.createItem(null, entry));
            } else {
                const lookup = this.field.value;
                let itemLabel;

                if (typeof this.options.dropdownLabel === 'function') {
                    itemLabel = this.options.dropdownLabel(entry);
                } else {
                    if (typeof this.options.dropdownLabel === 'string') {
                        if (entry[this.options.dropdownLabel] !== undefined && entry[this.options.dropdownLabel] !== null) {
                            itemLabel = entry[this.options.dropdownLabel];
                        } else {
                            itemLabel = '';
                        }
                    } else {
                        if (entry.label !== undefined && entry.label !== null) {
                            itemLabel = entry.label;
                        } else {
                            itemLabel = '';
                        }
                    }
                }

                if (removeDiacritics(itemLabel).toLowerCase().includes(removeDiacritics(lookup).toLowerCase())) {
                    dropdownDiv.appendChild(this.createItem(lookup, entry));
                    if (this.options.maximumItems > 0 && ++count >= this.options.maximumItems)
                        break;
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
                    if (this.selectedItems.length){
                        this.showSuccess();
                    }  
                    else {
                        this.setDefaultIcon();
                    }
                    if (this.options.onSelectItem){
                        this.options.onSelectItem([...this.selectedItems]);
                    } 
                } else {
                    this.selectedItems = [{ value: dataValue, label: dataLabel }];
                    this.field.value = dataLabel;
                    this.dropdown.hide();
                    this.showSuccess();
                    if (this.options.onSelectItem){
                        this.options.onSelectItem(this.selectedItems[0]);
                    } 
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
