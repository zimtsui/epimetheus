import { Startable } from 'startable';
import { fork } from 'child_process';
import { once } from 'events';
import { STOP_SIGNAL } from './config';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
// TODO: 要考虑 subp.kill() 失败的情况
class Invoker extends Startable {
    constructor(config) {
        super();
        this.config = config;
        this.shouldBeRunning = false;
        this.reusable = true;
    }
    async _start() {
        this.subp = fork(resolve(dirname(fileURLToPath(import.meta.url)), './invokee.js'), [this.config.path, ...this.config.args], {
            cwd: this.config.cwd,
            execArgv: this.config.nodeArgs,
            env: {
                ...process.env,
                epimetheus: 'true',
            },
            stdio: ['ignore', this.config.stdout, this.config.stderr, 'ipc'],
        });
        this.subp.on('message', (message) => {
            if (message === 4 /* STOPPING */)
                this.stop(new Error('self stop'));
        });
        await new Promise((resolve, reject) => {
            this.subp.on('message', (message) => {
                switch (message) {
                    case 2 /* STARTED */:
                        resolve();
                        break;
                    case 3 /* FAILED */:
                        reject();
                        break;
                }
            });
        });
    }
    async _stop(err) {
        if (!err)
            this.subp.kill(STOP_SIGNAL);
        await once(this.subp, 'exit');
    }
}
export { Invoker as default, Invoker, };
//# sourceMappingURL=invoker.js.map