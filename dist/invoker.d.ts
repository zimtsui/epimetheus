/// <reference types="node" />
import { Startable } from 'startable';
import { ChildProcess } from 'child_process';
import { ControllerConfig } from './interfaces';
declare class Invoker extends Startable {
    config: ControllerConfig;
    subp: ChildProcess;
    shouldBeRunning: boolean;
    constructor(config: ControllerConfig);
    protected _start(): Promise<void>;
    protected _stop(err?: Error): Promise<void>;
}
export { Invoker as default, Invoker, };
