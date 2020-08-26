import { Startable } from 'startable';
import { Config } from './interfaces';
declare class Controller extends Startable {
    config: Config;
    private process;
    constructor(config: Config);
    protected _start(): Promise<void>;
    protected _stop(err?: Error): Promise<void>;
}
export { Controller as default, Controller, };
