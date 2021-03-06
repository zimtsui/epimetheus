/// <reference types="node" />
import { Startable } from 'startable';
import { ChildProcess } from 'child_process';
import { InvokerConfig } from './interfaces';
declare class AbnormalExit extends Error {
}
declare class Invoker extends Startable {
    config: InvokerConfig;
    subp?: ChildProcess;
    constructor(config: InvokerConfig);
    protected _start(): Promise<void>;
    protected _stop(err?: Error): Promise<void>;
    kill(): boolean;
}
export { Invoker as default, Invoker, AbnormalExit, };
