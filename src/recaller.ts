import Startable from 'startable';
import Invoker from './invoker';
import { SerializableConfig, InvokerConfig } from './interfaces';
import fse from 'fs-extra';
import { createWriteStream, WriteStream } from 'fs';
import { once } from 'events';
import { format, promisify } from 'util';
const { ensureFileSync } = fse;

class Recaller extends Startable {
    public invoker?: Invoker;
    public shouldBeRunning = false;

    constructor(public config: SerializableConfig) {
        super();
    }

    protected async _start() {
        ensureFileSync(this.config.outFilePath!);
        ensureFileSync(this.config.errFilePath!);
        const invokerConfig: InvokerConfig = {
            ...this.config,
            stdout: createWriteStream(this.config.outFilePath!, { flags: 'a' }),
            stderr: createWriteStream(this.config.errFilePath!, { flags: 'a' }),
        };
        await once(<WriteStream>invokerConfig.stdout, 'open');
        await once(<WriteStream>invokerConfig.stderr, 'open');
        this.invoker = new Invoker(invokerConfig);

        const onStopping = (err?: Error) => {
            // 处理所有 start() 异常和运行中异常
            if (err) (<WriteStream>this.invoker!.config.stderr).write(`${format(err)}\n`);
            this.invoker!.stopped!.then(async () => {
                if (await this.invoker!.started!.then(() => true, () => false))
                    if (this.shouldBeRunning)
                        this.invoker!.start(onStopping).catch(() => { });
                    else;
                else
                    // start() 异常在 onStopping() 中处理
                    // 对外抛出抽象异常
                    this.stop(new Error('invoker start() error')).catch(console.error);
            }, err => {
                // 处理 stop() 异常
                (<WriteStream>this.invoker!.config.stderr).write(`${format(err)}\n`);
                // 对外抛出抽象异常
                this.stop(new Error('invoker stop() error')).catch(console.error);
            });
        }

        this.shouldBeRunning = true;
        await this.invoker.start(onStopping)
            .catch(err => {
                throw new Error('invoker start() error');
            });
    }

    protected async _stop() {
        try {
            this.shouldBeRunning = false;
            // stop() 的异常在 onStopping() 中处理
            await this.invoker!.stop();
        } catch (err) {
            // 对外抛出抽象异常
            throw new Error('invoker stop() error');
        } finally {
            /* 
                writable.end() 成功时传入 callback 的第一个参数是不存在的，
                而不是 null，不符合规范所以不能用 util.promisify()
            */
            await new Promise((resolve, reject) => {
                (<WriteStream>this.invoker!.config.stdout).end((err?: Error) => {
                    if (!err) resolve(); else reject(err);
                });
            });
            await new Promise((resolve, reject) => {
                (<WriteStream>this.invoker!.config.stderr).end((err?: Error) => {
                    if (!err) resolve(); else reject(err);
                });
            });
        }
    }

    public kill() {
        // 这句话不需要，因为 kill() 是最后一个事件循环。
        // this.shouldBeRunning = false;
        if (this.invoker) this.invoker.kill();

        if (this.invoker) {
            (<WriteStream>this.invoker.config.stdout).destroy();
            (<WriteStream>this.invoker.config.stderr).destroy();
        }
    }
}

export {
    Recaller as default,
    Recaller,
}