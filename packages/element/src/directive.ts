import { directive, Directive, DirectiveFactory, DirectiveUpdater } from '@shlim/html';
export { Directive, DirectiveFactory, DirectiveUpdater };

// name or [name, shorthand]
export function defineDirective(key: string|[string, string], factory: DirectiveFactory): void {
  if (Array.isArray(key)) {
    key[0] = 'v-' + key[0];
  } else {
    key = 'v-' + key;
  }

  directive(key, factory);
}
