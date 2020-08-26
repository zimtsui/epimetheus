/// <reference types="node" />
import { LifePeriod } from 'startable';
import { Serializable } from 'child_process';
export interface Config {
    name: string;
    servicePath: string;
    cwd: string;
    args: string[];
    nodeArgs: string;
}
export interface Message {
    event: LifePeriod;
    arg: Serializable;
}
