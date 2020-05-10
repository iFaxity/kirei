declare type DefaultFactory<T = any> = () => T | null | undefined;
declare type PropConstructor<T = any> = {
    new (...args: any[]): T & object;
} | {
    (): T;
};
declare type PropType<T> = PropConstructor<T> | PropConstructor<T>[];
interface PropInstance<T = any> {
    type: PropType<T>;
    required?: boolean;
    validator?(value: unknown): boolean;
    default?: DefaultFactory<T> | T;
}
declare type Prop<T> = PropInstance<T> | PropType<T> | null;
export declare type PropsData = Record<string, unknown>;
export declare type Props<P = PropsData> = {
    [K in keyof P]: Prop<P[K]>;
};
interface NormalizedProp<T = any> extends PropInstance<T> {
    type: PropConstructor<T>[] | null;
    cast?: boolean;
}
export declare type NormalizedProps = Record<string, NormalizedProp>;
declare type RequiredKeys<T> = {
    [K in keyof T]: T[K] extends {
        required: true;
    } | {
        default: any;
    } ? K : never;
}[keyof T];
declare type OptionalKeys<T> = Exclude<keyof T, RequiredKeys<T>>;
declare type InferPropType<T> = T extends null | {
    type: null;
} ? any : T extends typeof Object | {
    type: typeof Object;
} ? {
    [key: string]: any;
} : T extends Prop<infer V> ? V : T;
export declare type ResolvePropTypes<T> = {
    [K in RequiredKeys<T>]: InferPropType<T[K]>;
} & {
    [K in OptionalKeys<T>]?: InferPropType<T[K]>;
};
/**
 * Normalizes a props model, making it more predictable
 * @param {Props} props Props to normalize
 * @returns {NormalizedProps}
 */
export declare function normalizeProps(props: Props): NormalizedProps;
/**
 * Extracts the default values from a props model
 * @param {NormalizedProps} props Props model to extract defaults from
 * @returns {PropsData}
 */
export declare function propDefaults(props: NormalizedProps): PropsData;
/**
 * Validates a prop against a value, casts value if needed
 * @param {NormalizedProps} props Prop model to validate from
 * @param {string} key Attribute key
 * @param {*} value Value to validate
 * @returns {*}
 */
export declare function validateProp(props: NormalizedProps, key: string, value: unknown): unknown;
export {};
//# sourceMappingURL=props.d.ts.map