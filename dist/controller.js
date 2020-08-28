import { Startable } from 'startable';
import { fork } from 'child_process';
import { once } from 'events';
import { STOP_SIGNAL } from './config';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
// TODO: 要考虑 subp.kill() 失败的情况
// TODO: 要考虑 message 不按顺序来的情况
class Controller extends Startable {
    constructor(config) {
        super();
        this.config = config;
        this.shouldBeRunning = true;
        this.reusable = true;
    }
    async _start() {
        this.subp = fork(resolve(dirname(fileURLToPath(import.meta.url)), './soulmate.js'), [this.config.servicePath, ...this.config.args], {
            cwd: this.config.cwd,
            execArgv: this.config.nodeArgs,
            env: {
                ...process.env,
                epimetheus: 'true',
            },
            stdio: process.env.NODE_ENV === 'test' ? 'ignore' : 'inherit',
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
export { Controller as default, Controller, };
//# sourceMappingURL=controller.js.map