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
}
export interface ControllerConfig extends ConfigBase {
    outFilePath?: string;
    errFilePath?: string;
    stdout?: Writable | 'ignore' | 'inherit';
    stderr?: Writable | 'ignore' | 'inherit';
}
export interface Info extends ConfigBase {
    status: LifePeriod;
}
