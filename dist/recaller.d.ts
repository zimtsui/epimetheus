import Startable from 'startable';
import Invoker from './invoker';
import { SerializableConfig } from './interfaces';
declare class Recaller extends Startable {
    config: SerializableConfig;
    invoker?: Invoker;
    shouldBeRunning: boolean;
    constructor(config: SerializableConfig);
    protected _start(): Promise<void>;
    protected _stop(): Promise<void>;
    kill(): void;
}
export { Recaller as default, Recaller, };
