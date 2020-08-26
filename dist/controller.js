import { Startable } from 'startable';
import { fork } from 'child_process';
import { once } from 'events';
import { STOP_SIGNAL } from './config';
class Controller extends Startable {
    constructor(config) {
        super();
        this.config = config;
    }
    async _start() {
        this.process = fork(this.config.servicePath, this.config.args, { cwd: this.config.cwd });
        this.process.on('message', (message) => {
            if (message === 4 /* STOPPING */)
                this.stop(new Error());
        });
        await new Promise((resolve, reject) => {
            this.process.on('message', (message) => {
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
            this.process.kill(STOP_SIGNAL);
        await once(this.process, 'exit');
    }
}
export { Controller as default, Controller, };
//# sourceMappingURL=controller.js.map