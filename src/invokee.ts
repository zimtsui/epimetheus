import { Startable, LifePeriod } from 'startable';
import { STOP_TIMEOUT } from './config';
import { resolve } from 'path';
import { promisify } from 'util';
(async () => {
    const sleep = promisify(setTimeout);

    switch (process.env.epimetheus) {
        case 'false': process.env.epimetheus = ''; break;
        case 'FALSE': process.env.epimetheus = ''; break;
        case '': process.env.epimetheus = 'true'; break;
    }

    if (!process.env.epimetheus)
        console.log('WARNING: It\'s not called by Epimetheus.');

    interface StartableConsctrutor {
        new(...args: any[]): Startable;
    }

    const any = (promises: Promise<unknown>[]) =>
        new Promise((resolve, reject) =>
            void promises.forEach(promise => void promise.then(resolve, reject))
        );

    const Service: StartableConsctrutor = (await import(
        resolve(process.cwd(), process.argv[2])
    )).default;

    // Invokee 是一个对外不抛出异常的类，所有异常都在内部处理。
    class Invokee extends Startable {
        private service = new Service();

        protected async _start() {
            await this.service.start(err => {
                // 放到 invokee 的 onStopping() 中处理，因为要在 exit 前输出到 sterr
                this.stop(err).catch(() => { });
            }).then(() => {
                if (process.env.epimetheus) process.send!(LifePeriod.STARTED);
            }, () => {
                if (process.env.epimetheus) process.send!(LifePeriod.FAILED);
            });
        }

        protected async _stop() {
            if (process.env.epimetheus) process.send!(LifePeriod.STOPPING);

            await any([
                this.service.stop().then(() => {
                    if (process.env.epimetheus) process.disconnect();
                }),
                sleep(STOP_TIMEOUT).then(() => { throw new Error('stop() times out.') }),
            ]);
        }
    }

    const invokee = new Invokee();
    process.on('SIGINT', () => {
        // 放到 invokee 的 onStopping() 中处理，因为要在 exit 前输出到 sterr
        invokee.stop().catch(() => { });
    });
    await invokee.start(err => {
        if (err) console.error(err);
        invokee.stopped!.then(
            () => void process.exit(0),
            err => {
                console.error(err);
                process.exit(1);
            });
    }).catch(console.error);
})().catch(console.error);