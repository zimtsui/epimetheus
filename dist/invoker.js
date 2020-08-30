import { Startable } from 'startable';
import { fork } from 'child_process';
import { once } from 'events';
import { STOP_SIGNAL } from './config';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
class AbnormalExit extends Error {
}
class Invoker extends Startable {
    constructor(config) {
        super();
        this.config = config;
        this.reusable = true;
    }
    async _start() {
        this.subp = fork(resolve(dirname(fileURLToPath(import.meta.url)), './invokee.js'), [this.config.path, ...this.config.args], {
            cwd: this.config.cwd,
            execArgv: this.config.nodeArgs,
            env: {
                ...process.env,
                EPIMETHEUS: 'true',
                STOP_TIMEOUT: `${this.config.STOP_TIMEOUT}`,
            },
            stdio: ['ignore', this.config.stdout, this.config.stderr, 'ipc'],
        });
        this.subp.on('exit', () => {
            this.subp = undefined;
            // 对于正常结束的进程，这句话是自动失效的。
            this.stop(new AbnormalExit('subprocess terminated'));
        });
        this.subp.on('message', (message) => {
            if (message === "STOPPING" /* STOPPING */)
                this.stop(new Error('self stop'));
        });
        await new Promise((resolve, reject) => {
            this.subp.on('message', (message) => {
                switch (message) {
                    case "STARTED" /* STARTED */:
                        resolve();
                        break;
                    case "FAILED" /* FAILED */:
                        reject();
                        break;
                }
            });
        });
    }
    async _stop(err) {
        if (err instanceof AbnormalExit)
            return;
        if (!err)
            this.subp.kill(STOP_SIGNAL);
        await once(this.subp, 'exit');
    }
    kill() {
        if (this.subp)
            return this.subp.kill('SIGKILL');
        return true;
    }
}
export { Invoker as default, Invoker, AbnormalExit, };
//# sourceMappingURL=invoker.js.map