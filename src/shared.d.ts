export declare function isObject(obj: any): boolean;
export declare function isFunction(fn: any): boolean;
export declare function isCollection(obj: any): boolean;
export declare function isObservable(obj: any): boolean;
export declare function mapObject<T, V>(callback: (key: string, value: any) => [string, V], obj: T): Record<string, V>;
export declare function camelToKebab(str: string): string;
//# sourceMappingURL=shared.d.ts.map