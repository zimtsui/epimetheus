#!/usr/bin/env -S node --experimental-specifier-resolution=node
import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import Controller from './controller';
import { Config } from './interfaces';
import { PORT } from './config';
import getInfo from './getInfo';

const server = new Koa();
const router = new Router();

const ctrlers = new Set<Controller>();

router.post('/start', async (ctx, next) => {
    const config: Config = ctx.request.body;
    const ctrler = new Controller(config);
    ctrlers.add(ctrler);
    async function onStop(err?: Error) {
        if (await ctrler.started!.then(() => true, () => false))
            ctrler.stopped!.then(() => {
                if (ctrler.shouldBeRunning) ctrler.start(onStop).catch(console.error);
            }, err => { });
    }
    await ctrler.start(onStop).then(() => {
        ctx.status = 204;
    }, err => {
        ctrlers.delete(ctrler);
        ctx.status = 404;
    });
});

router.get('/stop', async (ctx, next) => {
    const name = <string>ctx.query.name;
    let ctrlersToStop: Controller[];
    if (name) {
        const ctrler = [...ctrlers].find(ctrler => ctrler.config.name === name);
        if (ctrler) ctrlersToStop = [ctrler];
        else {
            ctx.status = 404;
            return;
        }
    } else ctrlersToStop = [...ctrlers];

    await Promise.all(ctrlersToStop.map(async ctrler => {
        ctrler.shouldBeRunning = false;
        await ctrler.stop().catch(console.error);
        ctrlers.delete(ctrler);
    }));
    ctx.status = 204;
});

router.get('/list', (ctx, next) => {
    if (ctx.query.name) {
        const ctrler = [...ctrlers].find(
            ctrler => ctrler.config.name === ctx.query.name
        );
        ctx.body = ctrler ? getInfo(ctrler) : null;
    } else ctx.body = [...ctrlers].map(getInfo);
});

server.use(bodyParser());
server.use(router.routes());
server.listen(PORT);

process.once('SIGINT', () => {
    process.once('SIGINT', () => {
        process.exit(1);
    });
    console.log('\nreceived SIGINT');
    console.log('send SIGINT again to terminate immediately.');
    ctrlers.forEach(ctrler => {
        ctrler.subp.on('error', console.error);
        ctrler.subp.kill('SIGKILL');
    });
    process.exit(0);
});