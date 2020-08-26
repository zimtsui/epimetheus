import { STOP_TIMEOUT } from './config';
if (!process.env.epimetheus)
    console.log('WARNING: It\'s started directly.');
(async () => {
    const Service = await import(process.argv[3]);
    const service = new Service();
    service.start((err) => {
        if (err)
            console.error(err);
        if (process.env.epimetheus)
            process.send(4 /* STOPPING */);
        setTimeout(() => {
            console.error(new Error('stop() times out.'));
            process.exit(0);
        }, STOP_TIMEOUT).unref();
        service.stopped
            .catch(console.error)
            .then(() => void process.exit(0));
    }).then(() => {
        if (process.env.epimetheus)
            process.send(2 /* STARTED */);
    }, (err) => {
        console.error(err);
        if (process.env.epimetheus)
            process.send(3 /* FAILED */);
    });
    process.on('SIGINT', () => {
        service.stop();
    });
})();
//# sourceMappingURL=soulmate.js.map