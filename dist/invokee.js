import { Startable } from 'startable';
import { resolve } from 'path';
import { promisify } from 'util';
const STOP_TIMEOUT = Number.parseInt(process.env.STOP_TIMEOUT);
let EPIMETHEUS;
(async () => {
    const sleep = promisify(setTimeout);
    switch (process.env.EPIMETHEUS) {
        case 'false':
            EPIMETHEUS = '';
            break;
        case 'FALSE':
            EPIMETHEUS = '';
            break;
        case '':
            EPIMETHEUS = 'true';
            break;
        default: EPIMETHEUS = process.env.EPIMETHEUS;
    }
    if (!EPIMETHEUS)
        console.log('WARNING: It\'s not called by Epimetheus.');
    const any = (promises) => new Promise((resolve, reject) => void promises.forEach(promise => void promise.then(resolve, reject)));
    const Service = (await import(resolve(process.cwd(), process.argv[2]))).default;
    // Invokee 是一个对外不抛出异常的类，所有异常都在内部处理。
    class Invokee extends Startable {
        constructor() {
            super(...arguments);
            this.service = new Service();
        }
        async _start() {
            await this.service.start(err => {
                // 放到 invokee 的 onStopping() 中处理，因为要在 exit 前输出到 sterr
                this.stop(err).catch(() => { });
            }).then(() => {
                if (EPIMETHEUS)
                    process.send("STARTED" /* STARTED */);
            }, () => {
                if (EPIMETHEUS)
                    process.send("FAILED" /* FAILED */);
            });
        }
        async _stop() {
            if (EPIMETHEUS)
                process.send("STOPPING" /* STOPPING */);
            await any([
                this.service.stop().then(() => {
                    if (EPIMETHEUS)
                        process.disconnect();
                }),
                sleep(STOP_TIMEOUT).then(() => { throw new Error('stop() times out.'); }),
            ]);
        }
    }
    const invokee = new Invokee();
    process.on('SIGINT', () => {
        // 放到 invokee 的 onStopping() 中处理，因为要在 exit 前输出到 sterr
        invokee.stop().catch(() => { });
    });
    await invokee.start(err => {
        if (err)
            console.error(err);
        invokee.stopped.then(() => void process.exit(0), err => {
            console.error(err);
            process.exit(1);
        });
    }).catch(console.error);
})().catch(console.error);
//# sourceMappingURL=invokee.js.map