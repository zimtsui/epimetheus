/// <reference types="node" />
import { Writable } from 'stream';
import { LifePeriod } from 'startable';
export interface ConfigBase {
    name: string;
    path: string;
    cwd: string;
    args: string[];
    nodeArgs: string[];
}
export interface SerializableConfig extends ConfigBase {
    outFilePath: string;
    errFilePath: string;
    STOP_TIMEOUT: number;
}
export interface InvokerConfig extends ConfigBase {
    stdout: Writable | 'ignore' | 'inherit';
    stderr: Writable | 'ignore' | 'inherit';
    STOP_TIMEOUT: number;
}
export interface Info extends ConfigBase {
    recallerStatus: LifePeriod;
    invokerStatus?: LifePeriod;
    pid?: number;
}
