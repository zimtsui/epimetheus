import Startable from 'startable';
import Bluebird from 'bluebird';
const { delay } = Bluebird;

class Service extends Startable {
    private timer!: NodeJS.Timer;

    protected async _start() {
        this.timer = setTimeout(() => { }, 1000000);
        switch (process.argv[3]) {
            case 'normal': return; break;
            case 'self stop':
                // delay(500).then(() => this.stop(new Error('self stop')));
                this.stop(new Error('self stop')).catch(console.error);
                break;
            case 'failed':
                throw new Error('failed');
                break;
            case 'broken': return; break;
            case 'self stop broken':
                // delay(500).then(() => this.stop(new Error('self stop')));
                this.stop(new Error('self stop')).catch(console.error);
                break;
        }
    }
    protected async _stop() {
        clearTimeout(this.timer);
        switch (process.argv[3]) {
            case 'normal': return; break;
            case 'self stop': return; break;
            case 'failed': return; break;
            case 'broken':
                throw new Error('broken');
                break;
            case 'self stop broken':
                throw new Error('broken');
                break;
        }
    }
}

export {
    Service as default,
    Service,
}