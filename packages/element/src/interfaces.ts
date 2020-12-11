import type { Template } from "@kirei/html";
import type { CSSResult } from "./css";
import type { InjectionKey } from "./api/inject";
import type { Directive } from "./compiler";

/**
 * @private
 */
export type PropConstructor<T = any> =
  | { new (...args: any[]): T & object }
  | { (): T };

type PropType<T> = PropConstructor<T> | PropConstructor<T>[];
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
export interface ElementOptions<P = Props, T = ResolvePropTypes<P>> {
  name: string;
  closed?: boolean;
  props?: P;
  setup(this: void, props: T, ctx: IKireiContext): SetupResult|Promise<SetupResult>;
  styles?: CSSResult | CSSResult[];
  directives?: Record<string, Directive>;
  emits: EmitsOptions;
}

/**
 * @private
 */
export interface NormalizedElementOptions<P = Props> extends Omit<ElementOptions<P>, 'props'|'emits'> {
  props: NormalizedProps<P>;
  styles: CSSResult[];
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
export interface IKireiContext {
  readonly el: IKireiElement;
  readonly attrs: Record<string, string>;
  readonly props: NormalizedProps;
  readonly emits: string[];

  /**
   * Dispatches an event from the host element
   * @param event Event to emit
   */
  emit(event: string, ...args: any[]): void;
}

/**
 * @private
 */
export interface IKireiInstance {
  readonly root: IKireiInstance;
  readonly el: IKireiElement;
  readonly parent?: IKireiInstance;
  options: NormalizedElementOptions;
  events: Record<string, Function>;
  props: PropsData;
  provides: Record<string | number | symbol, any>;
  directives?: Record<string, Directive>;
  template?: Promise<SetupResult>|SetupResult;
  emitted?: Record<string, boolean>;

  /**
   * Checks if the element instance is currently mounted
   * @returns If the element is mounted
   */
  readonly mounted: boolean;

  /**
   * Runs the setup function to collect dependencies and run logic
   */
  setup(): void|Promise<void>;

  /**
   * Provides a value for the instance
   */
  provide<T>(key: InjectionKey<T> | string, value: T): void;

  /**
   * Pushes this instance to the front of the active stack
   *
  activate(): void;
  */

  /**
   * Removes this instance from the front of the active stack
   * Will be no-op of the instance is not at the front
   *
  deactivate(): void;
  */

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
export interface IKireiElement extends HTMLElement {
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
  attributeChangedCallback(
    attr: string,
    oldValue: string,
    newValue: string
  ): void;
}
