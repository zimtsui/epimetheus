import { Startable } from 'startable';
import { STOP_TIMEOUT } from './config';
import { resolve } from 'path';
import { promisify } from 'util';
(async () => {
    const sleep = promisify(setTimeout);
    if (process.env.epimetheus === 'false')
        process.env.epimetheus = '';
    else if (process.env.epimetheus === 'FALSE')
        process.env.epimetheus = '';
    else if (process.env.epimetheus === '')
        process.env.epimetheus = 'true';
    if (!process.env.epimetheus)
        console.log('WARNING: It\'s not called by epimetheus.');
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
                // 放到 invokee 的 onStopping() 中处理，因为要输出到 sterr
                this.stop(err).catch(() => { });
            }).then(() => {
                if (process.env.epimetheus)
                    process.send("STARTED" /* STARTED */);
            }, () => {
                if (process.env.epimetheus)
                    process.send("FAILED" /* FAILED */);
            });
        }
        async _stop() {
            if (process.env.epimetheus)
                process.send("STOPPING" /* STOPPING */);
            await any([
                this.service.stop().then(() => {
                    if (process.env.epimetheus)
                        process.disconnect();
                }),
                sleep(STOP_TIMEOUT).then(() => { throw new Error('stop() times out.'); }),
            ]);
        }
    }
    const invokee = new Invokee();
    process.on('SIGINT', () => {
        // 放到 invokee 的 onStopping() 中处理，因为要输出到 sterr
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