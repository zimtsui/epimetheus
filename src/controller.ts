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
        this.process.on('message', msg => {
            if (msg === LifePeriod.STOPPING) this.stop(new Error('crash'));
        });
        await new Promise(resolve => {
            this.process.on('message', msg => {
                if (msg === LifePeriod.STARTED) resolve();
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