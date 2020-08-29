import { Startable, LifePeriod } from 'startable';
import { ChildProcess, fork } from 'child_process';
import { once } from 'events';
import { STOP_SIGNAL } from './config';
import { ControllerConfig } from './interfaces';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// TODO: 要考虑 subp.kill() 失败的情况

class Controller extends Startable {
    public subp!: ChildProcess;
    public shouldBeRunning = true;

    constructor(public config: ControllerConfig) {
        super();
        this.reusable = true;
    }

    protected async _start() {
        this.subp = fork(
            resolve(dirname(fileURLToPath(import.meta.url)), './invokee.js'),
            [this.config.path, ...this.config.args],
            {
                cwd: this.config.cwd,
                execArgv: this.config.nodeArgs,
                env: {
                    ...process.env,
                    epimetheus: 'true',
                },
                stdio: ['ignore', this.config.stdout, this.config.stderr, 'ipc'],
            }
        );
        this.subp.on('message', (message: LifePeriod) => {
            if (message === LifePeriod.STOPPING) this.stop(new Error('self stop'));
        });
        await new Promise((resolve, reject) => {
            this.subp.on('message', (message: LifePeriod) => {
                switch (message) {
                    case LifePeriod.STARTED: resolve(); break;
                    case LifePeriod.FAILED: reject(); break;
                }
            });
        });
    }

    protected async _stop(err?: Error) {
        if (!err) this.subp.kill(STOP_SIGNAL);
        await once(this.subp, 'exit');
    }
}

export {
    Controller as default,
    Controller,
}