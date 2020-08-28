import Startable from 'startable';
import { Server } from 'net';
import { promisify } from 'util';
const sleep = promisify(setTimeout);
class Service extends Startable {
    async _start() {
        this.timer = new Server().listen();
        switch (process.argv[3]) {
            case 'normal':
                return;
                break;
            case 'self stop':
                // delay(500).then(() => this.stop(new Error('self stop')));
                this.stop(new Error('self stop')).catch(console.error);
                break;
            case 'failed':
                throw new Error('failed');
                break;
            case 'broken':
                return;
                break;
            case 'self stop broken':
                // delay(500).then(() => this.stop(new Error('self stop')));
                this.stop(new Error('self stop')).catch(console.error);
                break;
        }
    }
    async _stop() {
        this.timer.close();
        switch (process.argv[3]) {
            case 'normal':
                return;
                break;
            case 'self stop':
                return;
                break;
            case 'failed':
                return;
                break;
            case 'broken':
                throw new Error('broken');
                break;
            case 'self stop broken':
                throw new Error('broken');
                break;
        }
    }
}
export { Service as default, Service, };
//# sourceMappingURL=service.js.map