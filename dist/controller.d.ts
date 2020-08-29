/// <reference types="node" />
import { Startable } from 'startable';
import { ChildProcess } from 'child_process';
import { Config } from './interfaces';
declare class Controller extends Startable {
    config: Config;
    subp: ChildProcess;
    shouldBeRunning: boolean;
    constructor(config: Config);
    protected _start(): Promise<void>;
    protected _stop(err?: Error): Promise<void>;
}
export { Controller as default, Controller, };
