import { Startable, LifePeriod } from 'startable';
import { STOP_TIMEOUT } from './config';

if (!process.env.epimetheus)
    console.log('WARNING: It\'s started directly.');

interface StartableConsctrutor {
    new(...args: any[]): Startable;
}

(async () => {
    const Service: StartableConsctrutor = await import(process.argv[2]);
    const service = new Service();
    service.start((err?: Error) => {
        if (err) console.error(err);
        if (process.env.epimetheus) process.send!(LifePeriod.STOPPING);
        setTimeout(
            () => {
                console.error(new Error('stop() times out.'));
                process.exit(0);
            },
            STOP_TIMEOUT,
        ).unref();
        service.stopped
            .catch(console.error)
            .then(() => {
                if (process.env.epimetheus) process.disconnect();
            });
    }).then(() => {
        if (process.env.epimetheus) process.send!(LifePeriod.STARTED);
    }, (err: Error) => {
        console.error(err);
        if (process.env.epimetheus) process.send!(LifePeriod.FAILED);
    });
    process.on('SIGINT', () => {
        service.stop();
    });
})();