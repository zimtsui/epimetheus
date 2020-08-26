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
        this.process.on('message', msg => {
            if (msg === 4 /* STOPPING */)
                this.stop(new Error('crash'));
        });
        await new Promise(resolve => {
            this.process.on('message', msg => {
                if (msg === 2 /* STARTED */)
                    resolve();
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