import { vi } from 'vitest';

class DropdownStub {
  element: Element;
  visible = false;

  constructor(element: Element) {
    this.element = element;
  }

  show(): void {
    this.visible = true;
    this.element.classList.add('show');
  }

  hide(): void {
    this.visible = false;
    this.element.classList.remove('show');
  }
}

Object.defineProperty(window, 'bootstrap', {
  value: {
    Dropdown: DropdownStub
  },
  writable: true
});

Object.defineProperty(globalThis, 'bootstrap', {
  value: window.bootstrap,
  writable: true
});

Element.prototype.scrollIntoView = vi.fn();
