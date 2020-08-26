import { Startable, LifePeriod } from 'startable';

if (!process.send)
    console.log('WARNING: It\'s started directly.');

const ERROR_STOP_TIMEOUT = 3000;

interface StartableConsctrutor {
    new(...args: any[]): Startable;
}

(async () => {
    const Service: StartableConsctrutor = await import(process.argv[3]);
    const service = new Service();
    service.start((err?: Error) => {
        if (!err) return;
        console.error(err);
        if (process.send) process.send(LifePeriod.STOPPING);
        setTimeout(
            () => void process.exit(1),
            ERROR_STOP_TIMEOUT,
        ).unref();
        service.stopped
            .catch(console.error)
            .then(() => void process.exit(1));
    }).then(() => {
        if (process.send) process.send(LifePeriod.STARTED);
    }, (err?: Error) => {
        if (process.send) process.send(LifePeriod.FAILED);
    });
    process.on('SIGINT', () => {
        service.stop();
    });
})();