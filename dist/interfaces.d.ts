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
    stdout: string;
    stderr: string;
}
export interface ControllerConfig extends ConfigBase {
    stdout: Writable | 'ignore' | 'inherit';
    stderr: Writable | 'ignore' | 'inherit';
}
export interface Info extends ConfigBase {
    status: LifePeriod;
}
