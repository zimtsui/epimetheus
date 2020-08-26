if (!process.send)
    console.log('WARNING: It\'s started directly.');
const ERROR_STOP_TIMEOUT = 3000;
(async () => {
    const Service = await import(process.argv[3]);
    const service = new Service();
    service.start((err) => {
        if (!err)
            return;
        console.error(err);
        if (process.send)
            process.send(4 /* STOPPING */);
        setTimeout(() => void process.exit(1), ERROR_STOP_TIMEOUT).unref();
        service.stopped
            .catch(console.error)
            .then(() => void process.exit(1));
    }).then(() => {
        if (process.send)
            process.send(2 /* STARTED */);
    }, (err) => {
        if (process.send)
            process.send(3 /* FAILED */);
    });
    process.on('SIGINT', () => {
        service.stop();
    });
})();
export {};
//# sourceMappingURL=soulmate.js.map