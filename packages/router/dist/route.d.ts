import { KireiElement } from '@kirei/element';
export interface RouteOptions {
    path: string;
    element: string | typeof KireiElement | Promise<typeof KireiElement>;
    slot?: string;
    name?: string;
    meta?: any;
    keepAlive?: boolean;
    routes?: RouteOptions[];
    redirect?: string | Function;
    caseSensitive?: boolean;
    aliases?: string[];
}
export declare class Route {
    private readonly regex;
    private readonly keys;
    private readonly ctor;
    private el;
    readonly routes?: Route[];
    readonly path: string;
    readonly slot?: string;
    readonly keepAlive: boolean;
    readonly meta?: any;
    readonly name?: string;
    readonly redirect?: string | Function;
    readonly caseSensitive?: boolean;
    readonly aliases?: string[];
    params: Record<string | number, string>;
    constructor(opts: RouteOptions);
    match(path: string): boolean;
    element(): Promise<Element>;
}
//# sourceMappingURL=route.d.ts.map