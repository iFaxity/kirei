import { Part } from 'lit-html';
import { FxRef } from '../reactive';
export declare class FxSyncPart implements Part {
    private ref;
    readonly element: Element;
    readonly value: unknown;
    readonly commit: () => void;
    constructor(element: Element, key: string);
    /**
     * Sets the ref value for this part
     */
    setValue(ref: FxRef): void;
    private selectHandler;
    private selectCommit;
    private radioCommit;
    private checkboxHandler;
    private checkboxCommit;
}
//# sourceMappingURL=SyncPart.d.ts.map