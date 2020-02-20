declare type DefaultFactory<T = any> = () => T | null | undefined;
declare type PropConstructor<T> = {
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
declare type PropsData = {
    [key: string]: unknown;
};
declare type Prop<T> = PropInstance<T> | PropType<T> | null;
export declare type Props<P = PropsData> = {
    [K in keyof P]: Prop<P[K]>;
};
interface NormalizedProp<T = any> extends PropInstance<T> {
    type: PropConstructor<T>[] | null;
    cast?: boolean;
}
export declare type NormalizedProps = {
    [key: string]: NormalizedProp;
};
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
export declare function normalizeProps(props: Props): NormalizedProps;
export declare function propDefaults(props: NormalizedProps): PropsData;
export declare function validateProp(props: NormalizedProps, key: string, value: any): any;
export {};
//# sourceMappingURL=props.d.ts.map