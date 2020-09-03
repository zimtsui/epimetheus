#!/usr/bin/env -S node --experimental-specifier-resolution=node --enable-source-maps
import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import { PORT } from './config';
import getInfo from './getInfo';
import Recaller from './recaller';
const server = new Koa();
const router = new Router();
const recallers = new Set();
router
    .post('/register', async (ctx, next) => {
    const config = ctx.request.body;
    if (![...recallers].find(recaller => recaller.config.name === config.name)) {
        ctx.status = 201;
        const recaller = new Recaller(config);
        recallers.add(recaller);
    }
    else {
        ctx.status = 405;
        ctx.message = 'Service already existing.';
    }
})
    .get('/start', async (ctx, next) => {
    const name = ctx.query.name;
    const recaller = [...recallers].find(recaller => recaller.config.name === name);
    if (recaller) {
        await recaller.start().then(() => {
            ctx.status = 204;
        }, err => {
            ctx.body = err.stack || null;
            ctx.status = 503;
            ctx.message = 'Failed to start.';
        });
    }
    else {
        ctx.status = 404;
        ctx.message = 'Service not found.';
    }
})
    .get('/stop', async (ctx, next) => {
    const name = ctx.query.name;
    let recallersToStop;
    if (name) {
        const recaller = [...recallers].find(recaller => recaller.config.name === name);
        if (recaller)
            recallersToStop = [recaller];
        else {
            ctx.status = 404;
            ctx.message = 'Service not found.';
            return;
        }
    }
    else
        recallersToStop = [...recallers];
    await Promise.all(recallersToStop.map(async (recaller) => {
        await recaller.stop();
    })).then(() => {
        ctx.status = 204;
    }, (err) => {
        ctx.body = err.stack || null;
        ctx.status = 500;
        ctx.message = 'Failed to stop.';
    });
})
    .get('/delete', async (ctx, next) => {
    const name = ctx.query.name;
    let recallersToDelete;
    if (name) {
        const recaller = [...recallers].find(recaller => recaller.config.name === name);
        if (recaller)
            recallersToDelete = [recaller];
        else {
            ctx.status = 404;
            ctx.message = 'Service not found.';
            return;
        }
    }
    else
        recallersToDelete = [...recallers];
    await Promise.all(recallersToDelete.map(recaller => {
        if (recaller.lifePeriod === "CONSTRUCTED" /* CONSTRUCTED */ ||
            recaller.lifePeriod === "STOPPED" /* STOPPED */)
            recallers.delete(recaller);
        else
            throw new Error('a running service cannot be deleted');
    })).then(() => {
        ctx.status = 204;
    }, err => {
        ctx.body = err.stack || null;
        ctx.status = 405;
        ctx.message = err.message;
    });
})
    .get('/list', (ctx, next) => {
    if (ctx.query.name) {
        const recaller = [...recallers].find(recaller => recaller.config.name === ctx.query.name);
        if (recaller) {
            ctx.body = getInfo(recaller);
        }
        else {
            ctx.status = 404;
            ctx.message = 'Service not found.';
        }
    }
    else
        ctx.body = [...recallers].map(getInfo);
});
server
    .use(bodyParser())
    .use(router.routes())
    .listen(PORT);
function onSignal() {
    process.once('SIGINT', () => void process.exit(1));
    process.once('SIGTERM', () => void process.exit(1));
    console.log('\nreceived SIGINT/SIGTERM');
    console.log('send SIGINT/SIGTERM again to terminate immediately.');
    if ([...recallers].reduce((allKilled, recaller) => {
        return allKilled && recaller.kill();
    }, true))
        process.exit(0);
    else
        process.exit(1);
}
process.once('SIGINT', onSignal);
process.once('SIGTERM', onSignal);
//# sourceMappingURL=controller.js.map