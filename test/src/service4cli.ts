import Startable from 'startable';
import { Server } from 'net';

class Service extends Startable {
    private timer!: Server;
    private selfStopTimer!: NodeJS.Timeout;
    protected async _start() {
        this.timer = new Server().listen();
        this.selfStopTimer = setTimeout(() => {
            this.stop(new Error('some fatal error')).catch(console.error);
        }, 5000).unref();
        // this.stop(new Error('self stop')).catch(console.error);

        console.log(`cwd: ${process.cwd()}`);
        console.log(`args: ${process.argv.slice(2)}`);

    }
    protected async _stop() {
        this.timer.close();
    }
}

export {
    Service as default,
    Service,
}