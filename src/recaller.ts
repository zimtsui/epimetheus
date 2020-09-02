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
        this.reusable = true;
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
            const stdout = <WriteStream>this.invoker!.config.stdout;
            await promisify(stdout.end.bind(stdout))();
            const stderr = <WriteStream>this.invoker!.config.stderr;
            await promisify(stderr.end.bind(stderr))();
        }
    }

    public kill(): boolean {
        // 这句话不需要，因为 kill() 是最后一个事件循环。
        // this.shouldBeRunning = false;

        if (this.invoker) {
            const killed = this.invoker.kill();
            (<WriteStream>this.invoker.config.stdout).destroy();
            (<WriteStream>this.invoker.config.stderr).destroy();
            return killed;
        }
        return true;
    }
}

export {
    Recaller as default,
    Recaller,
}