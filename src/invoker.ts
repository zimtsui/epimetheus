import { Startable, LifePeriod } from 'startable';
import { ChildProcess, fork } from 'child_process';
import { once } from 'events';
import { STOP_SIGNAL } from './config';
import { InvokerConfig } from './interfaces';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

class AbnormalExit extends Error { }

class Invoker extends Startable {
    public subp?: ChildProcess;

    constructor(public config: InvokerConfig) {
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
        this.subp.on('exit', () => {
            this.subp = undefined;
            // 对于正常结束的进程，这句话是自动失效的。
            this.stop(new AbnormalExit('subprocess terminated'));
        });
        this.subp.on('message', (message: LifePeriod) => {
            if (message === LifePeriod.STOPPING) this.stop(new Error('self stop'));
        });
        await new Promise((resolve, reject) => {
            this.subp!.on('message', (message: LifePeriod) => {
                switch (message) {
                    case LifePeriod.STARTED: resolve(); break;
                    case LifePeriod.FAILED: reject(); break;
                }
            });
        });
    }

    protected async _stop(err?: Error) {
        if (err instanceof AbnormalExit) return;
        if (!err) this.subp!.kill(STOP_SIGNAL);
        await once(this.subp!, 'exit');
    }

    public kill(): boolean {
        if (this.subp) return this.subp.kill('SIGKILL');
        return true;
    }
}

export {
    Invoker as default,
    Invoker,
    AbnormalExit,
}