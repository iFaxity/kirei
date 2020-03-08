import { Part } from 'lit-html';
declare type EventListener = (e: Event, detail?: any) => any;
export declare class FxEventPart implements Part {
    readonly element: Element;
    readonly eventName: string;
    readonly hasMods: boolean;
    readonly options?: AddEventListenerOptions;
    private __pendingValue;
    readonly boundListener: EventListener;
    value: undefined | EventListener;
    constructor(element: Element, name: string, eventContext?: EventTarget);
    setValue(value: EventListener): void;
    commit(): void;
}
export {};
//# sourceMappingURL=EventPart.d.ts.map