import { Startable, LifePeriod } from 'startable';
import { ChildProcess, fork } from 'child_process';
import { once } from 'events';
import { STOP_SIGNAL } from './config';
import { Config } from './interfaces';

class Controller extends Startable {
    private process!: ChildProcess;

    constructor(public config: Config) {
        super();
    }

    protected async _start() {
        this.process = fork(
            this.config.servicePath,
            this.config.args,
            { cwd: this.config.cwd }
        );
        this.process.on('message', (message: LifePeriod) => {
            if (message === LifePeriod.STOPPING) this.stop(new Error());
        });
        await new Promise((resolve, reject) => {
            this.process.on('message', (message: LifePeriod) => {
                switch (message) {
                    case LifePeriod.STARTED: resolve(); break;
                    case LifePeriod.FAILED: reject(); break;
                }
            });
        });
    }

    protected async _stop(err?: Error) {
        if (!err) this.process.kill(STOP_SIGNAL);
        await once(this.process, 'exit');
    }
}

export {
    Controller as default,
    Controller,
}