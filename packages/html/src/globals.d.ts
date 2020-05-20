interface ShadyCSS {
  nativeCss: boolean;
  nativeShadow: boolean;
  styleElement(host: Element, overrideProps?: {[key: string]: string}): void;
  getComputedStyleValue(element: Element, property: string): string;
  prepareTemplateDom(template: HTMLTemplateElement, name: string): void;
  prepareTemplate(template: HTMLTemplateElement, name: string, elementExtends?: string): void;
  prepareTemplateStyles(template: HTMLTemplateElement, name: string, elementExtends?: string): void;
  ScopingShim?: {
    prepareAdoptedCssText(cssText: string[], name: string): void;
  };
}

interface ShadyDOM {
  inUse: boolean;
  flush: () => void;
}

interface ShadowRoot {
  adoptedStyleSheets: CSSStyleSheet[];
}
declare var ShadowRoot: { prototype: ShadowRoot; new (): ShadowRoot; };

interface CSSStyleSheet {
  replaceSync(cssText: string): void;
  replace(cssText: string): Promise<unknown>;
}

interface Window {
  ShadyCSS?: ShadyCSS;
  ShadyDOM?: ShadyDOM;
  ShadowRoot: typeof ShadowRoot;
}
