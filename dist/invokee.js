import { STOP_TIMEOUT } from './config';
import { resolve } from 'path';
if (process.env.epimetheus === 'false')
    process.env.epimetheus = '';
else if (process.env.epimetheus === 'FALSE')
    process.env.epimetheus = '';
else if (process.env.epimetheus === '')
    process.env.epimetheus = 'true';
if (!process.env.epimetheus)
    console.log('WARNING: It\'s not called by epimetheus.');
(async () => {
    const Service = (await import(resolve(process.cwd(), process.argv[2]))).default;
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
            .catch(() => { })
            .then(() => {
            if (process.env.epimetheus)
                process.disconnect();
        }).catch(console.error);
    }).then(() => {
        if (process.env.epimetheus)
            process.send(2 /* STARTED */);
    }, () => {
        if (process.env.epimetheus)
            process.send(3 /* FAILED */);
    });
    process.on('SIGINT', () => {
        service.stop().catch(console.error);
    });
})().catch(console.error);
//# sourceMappingURL=invokee.js.map