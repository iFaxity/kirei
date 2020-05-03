interface ShadyCSS {
  nativeCss: boolean;
  nativeShadow: boolean;
  styleElement(host: Element, overrideProps?: {[key: string]: string}): void;
  getComputedStyleValue(element: Element, property: string): string;
  prepareTemplateDom(template: HTMLTemplateElement, name: string): void;
  prepareTemplate(template: HTMLTemplateElement, name: string, elementExtends?: string): void;
  prepareTemplateStyles(template: HTMLTemplateElement, name: string, elementExtends?: string): void;
  ScopingShim: undefined | {
    prepareAdoptedCssText(cssText: string[], name: string): void;
  };
}

interface Window {
  ShadyCSS?: ShadyCSS;
}
