#!/usr/bin/env -S node --experimental-specifier-resolution=node
import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import Controller from './controller';
import { Config } from './interfaces';
import { PORT } from './config';
import getInfo from './getInfo';

const daemon = new Koa();
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
        ctx.status = 200;
    }, err => {
        ctrlers.delete(ctrler);
        ctx.status = 404;
    });
});

router.get('/stop', async (ctx, next) => {
    const name = <string>ctx.query.name;
    const ctrler = [...ctrlers].find(controller => controller.config.name === name);
    if (ctrler) {
        ctrler.shouldBeRunning = false;
        await ctrler.stop().catch(console.error);
        ctx.status = 200;
    } else {
        ctx.status = 404;
    }
});

router.get('/list', (ctx, next) => {
    ctx.body = [...ctrlers].map(getInfo);
});

daemon.use(bodyParser());
daemon.use(router.routes());
daemon.listen(PORT);