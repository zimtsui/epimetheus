import { STOP_TIMEOUT } from './config';
import path from 'path';
process.on('unhandledRejection', (reason, promise) => {
    if (!(promise instanceof TypeError ||
        promise instanceof RangeError ||
        promise instanceof SyntaxError ||
        promise instanceof ReferenceError)) {
        promise.catch(() => { });
    }
});
if (process.env.epimetheus === 'false')
    process.env.epimetheus = '';
if (process.env.epimetheus === 'FALSE')
    process.env.epimetheus = '';
if (process.env.epimetheus === '')
    process.env.epimetheus = 'true';
if (!process.env.epimetheus)
    console.log('WARNING: It\'s started directly.');
(async () => {
    const Service = (await import(path.resolve(process.cwd(), process.argv[2]))).default;
    const service = new Service();
    service.start((err) => {
        if (err)
            console.error(err);
        if (process.env.epimetheus) {
            process.send(4 /* STOPPING */);
        }
        setTimeout(() => {
            console.error(new Error('stop() times out.'));
            process.exit(0);
        }, STOP_TIMEOUT).unref();
        service.stopped
            .catch(console.error)
            .then(() => {
            if (process.env.epimetheus)
                process.disconnect();
        });
    }).then(() => {
        if (process.env.epimetheus)
            process.send(2 /* STARTED */);
        console.log(`service.life: ${service.lifePeriod}`);
    }, () => {
        if (process.env.epimetheus)
            process.send(3 /* FAILED */);
    });
    process.on('SIGINT', () => {
        service.stop();
    });
})().catch(console.error);
//# sourceMappingURL=soulmate.js.map