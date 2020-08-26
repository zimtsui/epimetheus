import { Startable, LifePeriod } from 'startable';
import { ChildProcess, fork } from 'child_process';
import { once } from 'events';
import { STOP_SIGNAL } from './config';
import { Config } from './interfaces';

// TODO: 要考虑 subp.kill 失败的情况

class Controller extends Startable {
    private subp!: ChildProcess;
    public shouldBeRunning = true;

    constructor(public config: Config) {
        super();
    }

    protected async _start() {
        this.subp = fork(
            this.config.servicePath,
            this.config.args,
            {
                cwd: this.config.cwd,
                execArgv: this.config.nodeArgs,
            }
        );
        this.subp.on('message', (message: LifePeriod) => {
            if (message === LifePeriod.STOPPING) this.stop(new Error());
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