import Koa from 'koa';
import Router from 'koa-router';
import Controller from './controller';
import { Config } from './interfaces';
import { PORT } from './config';

const daemon = new Koa();
const router = new Router();

const controllers = new Set<Controller>();

router.post('/start', async (ctx, next) => {
    const config: Config = ctx.body;
    const controller = new Controller(config);
    controllers.add(controller);
    await controller.start((err?: Error) => {
        if (err?.message === 'crash') controller.stopped.then(() => controller.start());
    }).then(() => {
        ctx.status = 200;
    }, err => {
        controllers.delete(controller);
        ctx.status = 404;
    });
});

router.get('/stop', async (ctx, next) => {
    const name = <string>ctx.params.name;
    // 容错
    const controller = [...controllers].find(controller => controller.config.name === name)!;
    await controller.stop();
    ctx.status = 200;
});

router.get('/list', (ctx, next) => {

});

daemon.use(router.routes());
daemon.listen(PORT);