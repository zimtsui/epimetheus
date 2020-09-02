import Startable from 'startable';
import Invoker from './invoker';
import fse from 'fs-extra';
import { createWriteStream } from 'fs';
import { once } from 'events';
import { format, promisify } from 'util';
const { ensureFileSync } = fse;
class Recaller extends Startable {
    constructor(config) {
        super();
        this.config = config;
        this.shouldBeRunning = false;
        this.reusable = true;
    }
    async _start() {
        ensureFileSync(this.config.outFilePath);
        ensureFileSync(this.config.errFilePath);
        const invokerConfig = {
            ...this.config,
            stdout: createWriteStream(this.config.outFilePath, { flags: 'a' }),
            stderr: createWriteStream(this.config.errFilePath, { flags: 'a' }),
        };
        await once(invokerConfig.stdout, 'open');
        await once(invokerConfig.stderr, 'open');
        this.invoker = new Invoker(invokerConfig);
        const onStopping = (err) => {
            // 处理所有 start() 异常和运行中异常
            if (err)
                this.invoker.config.stderr.write(`${format(err)}\n`);
            this.invoker.stopped.then(async () => {
                if (await this.invoker.started.then(() => true, () => false))
                    if (this.shouldBeRunning)
                        this.invoker.start(onStopping).catch(() => { });
                    else
                        ;
                else
                    // start() 异常在 onStopping() 中处理
                    // 对外抛出抽象异常
                    this.stop(new Error('invoker start() error')).catch(console.error);
            }, err => {
                // 处理 stop() 异常
                this.invoker.config.stderr.write(`${format(err)}\n`);
                // 对外抛出抽象异常
                this.stop(new Error('invoker stop() error')).catch(console.error);
            });
        };
        this.shouldBeRunning = true;
        await this.invoker.start(onStopping)
            .catch(err => {
            throw new Error('invoker start() error');
        });
    }
    async _stop() {
        try {
            this.shouldBeRunning = false;
            // stop() 的异常在 onStopping() 中处理
            await this.invoker.stop();
        }
        catch (err) {
            // 对外抛出抽象异常
            throw new Error('invoker stop() error');
        }
        finally {
            const stdout = this.invoker.config.stdout;
            await promisify(stdout.end.bind(stdout))();
            const stderr = this.invoker.config.stderr;
            await promisify(stderr.end.bind(stderr))();
        }
    }
    kill() {
        // 这句话不需要，因为 kill() 是最后一个事件循环。
        // this.shouldBeRunning = false;
        if (this.invoker) {
            const killed = this.invoker.kill();
            this.invoker.config.stdout.destroy();
            this.invoker.config.stderr.destroy();
            return killed;
        }
        return true;
    }
}
export { Recaller as default, Recaller, };
//# sourceMappingURL=recaller.js.map