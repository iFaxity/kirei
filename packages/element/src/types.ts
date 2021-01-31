import type { Template } from '@kirei/html';
import type { StyleSheet } from './runtime/css';
import type { InjectionKey } from './api/inject';
import type { Directive } from './runtime/compiler';
import type { ReactiveEffect, Ref, UnwrapRef } from '@vue/reactivity';

/**
 * Unwraps refs recursively, essentially a reactive() from @vue/reactivity.
 * @private
 */
export type UnwrapNestedRefs<T> = T extends Ref ? T : UnwrapRef<T>;

/**
 * @private
 */
export type PropConstructor<T = any> =
  | { new (...args: any[]): T & object }
  | { (): T };

/**
 * @private
 */
export type PropType<T> = PropConstructor<T> | PropConstructor<T>[];

/**
 * @private
 */
type DefaultFactory<T = any> = () => T | null | undefined;

/**
 * @private
 */
export interface PropInstance<T = any> {
  type: PropType<T>;
  required?: boolean;
  validator?(value: any): boolean;
  default?: DefaultFactory<T> | T;
}

/**
 * @private
 */
type Prop<T> = PropInstance<T> | PropType<T> | null;

/**
 * @private
 */
export type Props<P = Record<string, any>> = { [K in keyof P]: Prop<P[K]> };

/**
 * @private
 */
export interface NormalizedProp<T = any> extends PropInstance<T> {
  type: PropConstructor<T>[] | null;
  cast?: boolean;
}

/**
 * @private
 */
export type NormalizedProps<T = Props> = {
  [K in keyof T]: NormalizedProp<T[K] extends Prop<infer V> ? V : any>;
};

/**
 * @private
 */
export type PropsData<T extends NormalizedProps = any> = {
  [K in keyof T]: T[K] extends NormalizedProp<infer V> ? V : any;
};

type RequiredKeys<T> = {
  [K in keyof T]: T[K] extends { required: true } | { default: any }
    ? K
    : never;
}[keyof T];

type OptionalKeys<T> = Exclude<keyof T, RequiredKeys<T>>;
type InferPropType<T> = T extends null | { type: null }
  ? any
  : T extends typeof Object | { type: typeof Object }
  ? { [key: string]: any }
  : T extends Prop<infer V>
  ? V
  : T;

/**
 * @private
 */
export type ResolvePropTypes<T> = {
  [K in RequiredKeys<T>]: InferPropType<T[K]>;
} &
  { [K in OptionalKeys<T>]?: InferPropType<T[K]> };

export type EmitsOptions = string[] | Record<string, EmitsValidator|null>;
export type NormalizedEmitsOptions = Record<string, EmitsValidator|null>;
type EmitsValidator = (...args: any[]) => boolean;

/**
 * Setup function result type
 */
export type SetupResult = () => Template | Node;

/**
 * @private
 */
export interface ComponentOptions<P = Props, T = ResolvePropTypes<P>> {
  name: string;
  props?: P;
  setup(this: void, props: T, ctx: SetupContext): SetupResult|Promise<SetupResult>;
  styles?: StyleSheet | StyleSheet[];
  directives?: Record<string, Directive>;
  emits?: EmitsOptions;
}

/**
 * @private
 */
export interface NormalizedComponentOptions<P = Props> extends Omit<ComponentOptions<P>, 'props'|'emits'> {
  props: NormalizedProps<P>;
  styles: StyleSheet[];
  emits: NormalizedEmitsOptions;
  tag: string;
  attrs: Record<string, string>;
  hooks?: Record<string, Function[]>;
  attributes: string[];
  // used in hmr with logging
  filename?: string;
}

/**
 * @private
 */
export interface SetupContext {
  readonly el: IComponent;
  readonly attrs: Record<string, string>;

  /**
   * Dispatches an event from the host Component
   * @param event Event to emit
   */
  emit(event: string, ...args: any[]): void;
}

/**
 * @private
 */
export interface ComponentInstance {
  readonly hooks: Record<string, Set<Function>>;
  readonly effect: ReactiveEffect;
  readonly root: ComponentInstance;
  readonly el: IComponent;
  readonly parent: ComponentInstance;
  readonly props: PropsData;
  readonly setupResult: Promise<SetupResult>|SetupResult;
  readonly shadowRoot: ShadowRoot;
  readonly provides: Record<string | symbol, unknown>;
  readonly directives?: Record<string, Directive>;
  readonly emitted?: Record<string, boolean>;
  readonly events: Record<string, Function>;
  options: NormalizedComponentOptions;

  /**
   * Checks if the Component instance is currently mounted
   * @returns If the Component is mounted
   */
  mounted: boolean;

  /**
   * Binds event to element
   * @param event - Event to bind
   * @param listener - Function to run when event is fired
   */
  on(event: string, listener: Function): void;

  /**
   * Binds event to element which is only called once
   * @param event - Event to bind
   * @param listener - Function to run when event is fired
   */
  once(event: string, listener: Function): void;

  /**
   * Unbind event(s) from the element
   * @param event - Event to unbind
   * @param listener - Specific listener to unbind
   */
  off(event: string, listener?: Function): void;

  /**
   * Dispatches an event to parent instance
   * @param eventName - Event to emit
   * @param detail - Custom event value
   */
  emit(event: string, ...args: any[]): void;

  /**
   * Runs the setup function to collect dependencies and run logic
   */
  setup(): void|Promise<void>;

  /**
   * Provides a value for the instance
   */
  provide<T>(key: InjectionKey<T> | string, value: T): void;

  /**
   * Reflows styles with shady shims or adopted stylesheets
   * @param mount - True If mounting or false if updating
   */
  reflowStyles(mount?: boolean): Promise<void>;

  /**
   * Create shadow root and shim styles
   */
  mount(): void;

  /**
   * Call unmounting lifecycle hooks
   */
  unmount(): void;

  /**
   * Runs all the specified hooks on the Fx instance
   * @param hook - Specified hook name
   */
  runHooks(hook: string, ...args: any[]): void;

  /**
   * Adds a lifecycle hook to instance
   */
  injectHook(name: string, hook: Function): void;

  /**
   * Renders shadow root content
   */
  update(): void;
}

/**
 * @private
 */
export interface IComponent extends HTMLElement {
  /**
   * Runs when mounted from DOM
   */
  connectedCallback(): void;

  /**
   * Runs when unmounted from DOM
   */
  disconnectedCallback(): void;

  /**
   * Observes attribute changes, triggers updates on props
   */
  attributeChangedCallback(attr: string, oldValue: string, newValue: string): void;
}
