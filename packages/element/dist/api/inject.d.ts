export interface InjectionKey<T> extends Symbol {
}
export declare function provide<T>(key: InjectionKey<T> | string, value: T): void;
export declare function inject<T>(key: InjectionKey<T> | string): T | undefined;
//# sourceMappingURL=inject.d.ts.map