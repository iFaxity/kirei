// Globals for identifying versions in builds
declare global {
  var __DEV__: boolean;
  var __BROWSER__: boolean;
  var __NODE_JS__: boolean;
  var __VERSION__: string;

  interface ShadyDOM {
    inUse: boolean;
    flush(): void;
  }

  interface ShadyCSS {
    nativeCss: boolean;
    nativeShadow: boolean;
    styleElement(host: Element, properties?: object): void;
    styleSubtree(element: HTMLElement, properties?: object): void;
    prepareTemplateDom(template: HTMLTemplateElement, name: string): void;
    prepareTemplate(template: HTMLTemplateElement, name: string, elementExtends?: string): void;
    prepareTemplateStyles(template: HTMLTemplateElement, name: string, elementExtends?: string): void;
    ScopingShim?: {
      prepareAdoptedCssText(cssText: string[], name: string): void;
    };
  }

  interface CSSStyleSheet {
    replaceSync(cssText: string): void;
    replace(cssText: string): Promise<unknown>;
  }

  interface ShadowRoot {
    adoptedStyleSheets: CSSStyleSheet[];
  }

  var ShadowRoot: { prototype: ShadowRoot; new (): ShadowRoot; };

  interface Window {
    ShadyCSS?: ShadyCSS;
    ShadyDOM?: ShadyDOM;
    ShadowRoot: typeof ShadowRoot;
  }
}

export {};
