import { Startable } from 'startable';
import { Config } from './interfaces';
declare class Controller extends Startable {
    config: Config;
    private subp;
    shouldBeRunning: boolean;
    constructor(config: Config);
    protected _start(): Promise<void>;
    protected _stop(err?: Error): Promise<void>;
}
export { Controller as default, Controller, };
