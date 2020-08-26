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
    await ctrler.start(err => {
        ctrler.stopped.then(() => {
            if (ctrler.shouldBeRunning) ctrler.start();
        });
    }).then(() => {
        ctx.status = 200;
    }, err => {
        ctrlers.delete(ctrler);
        ctx.status = 404;
    });
});

router.get('/stop', async (ctx, next) => {
    const name = <string>ctx.params.name;
    const ctrler = [...ctrlers].find(controller => controller.config.name === name);
    if (ctrler) {
        ctrler.shouldBeRunning = false;
        await ctrler.stop();
        ctx.status = 200;
    } else {
        ctx.body = 404;
    }
});

router.get('/list', (ctx, next) => {
    ctx.body = [...ctrlers].map(getInfo);
});

daemon.use(bodyParser());
daemon.use(router.routes());
daemon.listen(PORT);