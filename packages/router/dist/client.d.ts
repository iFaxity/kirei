import { KireiInstance } from '@kirei/element';
import { Link, RouterOptions, RouterInterface, Router } from './router';
export declare class ClientRouter extends Router implements RouterInterface {
    readonly views: Node[];
    readonly history: boolean;
    constructor(opts: RouterOptions);
    attach(instance: KireiInstance): void;
    detach(instance: KireiInstance): void;
    push(link: Link, append: boolean): void;
    replace(link: Link, append: boolean): void;
    protected navigate(): Promise<void>;
}
//# sourceMappingURL=client.d.ts.map