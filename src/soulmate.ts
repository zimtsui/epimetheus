import { Startable, LifePeriod } from 'startable';
import { STOP_TIMEOUT } from './config';
import path from 'path';

if (process.env.epimetheus === 'false') process.env.epimetheus = '';
else if (process.env.epimetheus === 'FALSE') process.env.epimetheus = '';
else if (process.env.epimetheus === '') process.env.epimetheus = 'true';

if (!process.env.epimetheus)
    console.log('WARNING: It\'s not called by epimetheus.');

interface StartableConsctrutor {
    new(...args: any[]): Startable;
}

(async () => {
    const Service: StartableConsctrutor = (await import(
        path.resolve(process.cwd(), process.argv[2])
    )).default;
    const service = new Service();
    service.start((err?: Error) => {
        if (err) console.error(err);
        if (process.env.epimetheus) {
            process.send!(LifePeriod.STOPPING);
        }
        setTimeout(
            () => {
                console.error(new Error('stop() times out.'));
                process.exit(0);
            },
            STOP_TIMEOUT,
        ).unref();
        service.stopped
            .catch(() => { })
            .then(() => {
                if (process.env.epimetheus) process.disconnect();
            }).catch(console.error);
    }).then(() => {
        if (process.env.epimetheus) process.send!(LifePeriod.STARTED);
    }, () => {
        if (process.env.epimetheus) process.send!(LifePeriod.FAILED);
    });

    process.on('SIGINT', () => {
        service.stop().catch(console.error);
    });
})().catch(console.error);