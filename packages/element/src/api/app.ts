import type { Directive } from '../runtime/compiler';
import type { InjectionKey } from './inject';
import type { ComponentInstance } from '../types';
import { hyphenate, isFunction } from '@vue/shared';
import { warn } from '../logging';
//import { version } from '../package.json';
const version = '1.1.3';

type PluginInstallFunction = (app: App, ...args: any[]) => any;

export type Plugin =
  | PluginInstallFunction & { install?: PluginInstallFunction }
  | { install: PluginInstallFunction };

export interface App {
  container: ComponentInstance|null;
  context: AppContext;
  version: string;
  config: AppConfig;
  use(plugin: Plugin, ...options: any[]): this;
  directive(name: string): Directive;
  directive(name: string, directive: Directive): this;
  provide<T>(key: InjectionKey<T> | string, value: T): this;
}

export interface AppConfig {
  performance: boolean;
  errorHandler?(
    err: unknown,
    instance: ComponentInstance | null,
    info: string
  ): void;
  warnHandler?(
    msg: string,
    instance: ComponentInstance | null,
    trace: string
  ): void;
}

export interface AppContext {
  app: App;
  config: AppConfig;
  directives: Record<string, Directive>;
  provides: Record<string | symbol, unknown>;
  /**
   * HMR only?
   * @internal
   */
  reload?(): void;
}

export const applications = new Map<string, App>();

export function createApp(root: string): App {
  const installedPlugins = new Set();
  const context: AppContext = {
    app: null,
    config: {
      performance: false,
      errorHandler: null,
      warnHandler: null,
    },
    directives: {},
    provides: Object.create(null)
  };

  // if instance has no parentNode, check for entry in app
  const app: App = (context.app = {
    container: null,
    context,
    version,

    get config() {
      return context.config;
    },

    use(plugin, ...args) {
      if (!installedPlugins.has(plugin)) {
        // Cyclomatic complexity is high here
        if (plugin && isFunction(plugin.install)) {
          installedPlugins.add(plugin);

          if (isFunction(plugin)) {
            plugin(app, ...args);
          } else if (isFunction(plugin.install)) {
            plugin.install(app, ...args);
          } else if (__DEV__) {
            warn(`A plugin must either be a function or an object with an 'install' function.`);
          }

          installedPlugins.add(plugin);
        }
      } else if (__DEV__) {
        warn(`Plugin has already been applied to target app.`);
      }

      return app;
    },

    directive(name: string, directive?: Directive) {
      if (__DEV__) {
        //validateDirectiveName(name);
      }

      name = hyphenate(name);

      if (!directive) {
        return context.directives[name] as any;
      }

      if (__DEV__ && context.directives[name]) {
        warn(`Directive '${name}' has already been registered in target app.`);
      }

      context.directives[name] = directive;
      return app;
    },

    provide(key, value) {
      if (__DEV__ && (key as string | symbol) in context.provides) {
        warn(`App already provides property with key '${String(key)}'. It will be overwritten with the new value.`);
      }

      // TypeScript doesn't allow symbols as index type
      // https://github.com/Microsoft/TypeScript/issues/24587
      context.provides[key as string] = value;

      return app;
    },
  });

  applications.set(root, app);
  return app;
}
