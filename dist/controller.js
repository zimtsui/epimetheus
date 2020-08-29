#!/usr/bin/env -S node --experimental-specifier-resolution=node
import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import Invoker from './invoker';
import { PORT } from './config';
import getInfo from './getInfo';
import { createWriteStream } from 'fs';
import fse from 'fs-extra';
import { format } from 'util';
import { once } from 'events';
const { ensureFileSync } = fse;
const server = new Koa();
const router = new Router();
const invokers = new Set();
function isNotRunning(invoker) {
    return (invoker.lifePeriod === 0 /* CONSTRUCTED */ ||
        invoker.lifePeriod === 5 /* STOPPED */ ||
        invoker.lifePeriod === 6 /* BROKEN */) && !invoker.shouldBeRunning;
}
// TODO broken
function isRunning(invoker) {
    return invoker.shouldBeRunning;
}
router
    .post('/register', async (ctx, next) => {
    const config = ctx.request.body;
    if (![...invokers].find(invoker => invoker.config.name === config.name)) {
        ctx.status = 201;
        const invoker = new Invoker(config);
        invokers.add(invoker);
    }
    else {
        ctx.status = 405;
        ctx.message = 'Service already existing.';
    }
})
    .put('/start', async (ctx, next) => {
    const name = ctx.query.name;
    const invoker = [...invokers].find(invoker => invoker.config.name === name);
    if (invoker) {
        if (isRunning(invoker)) {
            ctx.status = 208;
            ctx.message = 'Already started.';
            return;
        }
        ensureFileSync(invoker.config.outFilePath);
        ensureFileSync(invoker.config.errFilePath);
        invoker.config.stdout = createWriteStream(invoker.config.outFilePath, { flags: 'a' });
        invoker.config.stderr = createWriteStream(invoker.config.errFilePath, { flags: 'a' });
        await once(invoker.config.stdout, 'open');
        await once(invoker.config.stderr, 'open');
        function onStopping(err) {
            // 处理所有 start() 异常和运行中异常
            if (err)
                invoker.config.stderr.write(`${format(err)}\n`);
            invoker.stopped.then(async () => {
                if (await invoker.started.then(() => true, () => false) &&
                    invoker.shouldBeRunning)
                    // start() 异常在 onStopping() 中处理
                    invoker.start(onStopping).catch(() => { });
                else {
                    invoker.config.stdout.end();
                    invoker.config.stderr.end();
                    invoker.shouldBeRunning = false;
                }
            }, err => {
                // 处理所有 stop() 异常
                invoker.config.stderr.write(`${format(err)}\n`);
                invoker.config.stdout.end();
                invoker.config.stderr.end();
                invoker.shouldBeRunning = false;
            });
        }
        invoker.shouldBeRunning = true;
        await invoker.start(onStopping).then(() => {
            ctx.status = 204;
        }, err => {
            // err 在 onStopping() 中处理
            ctx.status = 503;
            ctx.message = 'Failed to start.';
        });
    }
    else {
        ctx.status = 404;
        ctx.message = 'Service not found.';
    }
})
    .put('/stop', async (ctx, next) => {
    const name = ctx.query.name;
    let invokersToStop;
    if (name) {
        const invoker = [...invokers].find(invoker => invoker.config.name === name);
        if (invoker)
            invokersToStop = [invoker];
        else {
            ctx.status = 404;
            ctx.message = 'Service not found.';
            return;
        }
    }
    else
        invokersToStop = [...invokers];
    await Promise.all(invokersToStop.map(async (invoker) => {
        invoker.shouldBeRunning = false;
        // stop() 的异常在 onStopping() 中处理
        await invoker.stop();
    })).catch(err => {
        ctx.status = 500;
        ctx.message = 'Failed to stop.';
        throw err;
    });
    ctx.status = 204;
})
    .delete('/delete', async (ctx, next) => {
    const name = ctx.query.name;
    let invokersToDelete;
    if (name) {
        const invoker = [...invokers].find(invoker => invoker.config.name === name);
        if (invoker)
            invokersToDelete = [invoker];
        else {
            ctx.status = 404;
            ctx.message = 'Service not found.';
            return;
        }
    }
    else
        invokersToDelete = [...invokers];
    await Promise.all(invokersToDelete.map(invoker => {
        if (isNotRunning(invoker))
            invokers.delete(invoker);
        else
            throw new Error('a running service cannot be deleted');
    })).catch((err) => {
        ctx.status = 405;
        ctx.message = err.message;
        throw err;
    });
    ctx.status = 204;
})
    .get('/list', (ctx, next) => {
    if (ctx.query.name) {
        const invoker = [...invokers].find(invoker => invoker.config.name === ctx.query.name);
        if (invoker) {
            ctx.body = getInfo(invoker);
        }
        else {
            ctx.status = 404;
            ctx.message = 'Service not found.';
        }
    }
    else
        ctx.body = [...invokers].map(getInfo);
});
server
    .use(bodyParser())
    .use(router.routes())
    .listen(PORT);
process.once('SIGINT', () => {
    process.once('SIGINT', () => {
        process.exit(1);
    });
    console.log('\nreceived SIGINT');
    console.log('send SIGINT again to terminate immediately.');
    invokers.forEach(invoker => {
        invoker.subp.on('error', console.error);
        invoker.subp.kill('SIGKILL');
    });
    process.exit(0);
});
//# sourceMappingURL=controller.js.map