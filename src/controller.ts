#!/usr/bin/env -S node --experimental-specifier-resolution=node
import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import { SerializableConfig } from './interfaces';
import { PORT } from './config';
import getInfo from './getInfo';
import { LifePeriod } from 'startable';
import Recaller from './recaller';

const server = new Koa();
const router = new Router();

const recallers = new Set<Recaller>();

router
    .post('/register', async (ctx, next) => {
        const config = <SerializableConfig>ctx.request.body;
        if (![...recallers].find(recaller => recaller.config.name === config.name)) {
            ctx.status = 201;
            const recaller = new Recaller(config);
            recallers.add(recaller);
        } else {
            ctx.status = 405;
            ctx.message = 'Service already existing.'
        }
    })

    .put('/start', async (ctx, next) => {
        const name = <string>ctx.query.name;
        const recaller = [...recallers].find(recaller => recaller.config.name === name);
        if (recaller) {
            await recaller.start().then(() => {
                ctx.status = 204;
            }, err => {
                console.error(err);
                ctx.status = 503;
                ctx.message = 'Failed to start.'
            });
        } else {
            ctx.status = 404;
            ctx.message = 'Service not found.';
        }
    })

    .put('/stop', async (ctx, next) => {
        const name = <string>ctx.query.name;
        let recallersToStop: Recaller[];
        if (name) {
            const recaller = [...recallers].find(invoker => invoker.config.name === name);
            if (recaller) recallersToStop = [recaller];
            else {
                ctx.status = 404;
                ctx.message = 'Service not found.';
                return;
            }
        } else recallersToStop = [...recallers];

        await Promise.all(recallersToStop.map(async invoker => {
            await invoker.stop();
        })).then(() => {
            ctx.status = 204;
        }, err => {
            console.error(err);
            ctx.status = 500;
            ctx.message = 'Failed to stop.'
        });
    })

    .delete('/delete', async (ctx, next) => {
        const name = <string>ctx.query.name;
        let recallersToDelete: Recaller[];
        if (name) {
            const recaller = [...recallers].find(invoker => invoker.config.name === name);
            if (recaller) recallersToDelete = [recaller];
            else {
                ctx.status = 404;
                ctx.message = 'Service not found.';
                return;
            }
        } else recallersToDelete = [...recallers];

        await Promise.all(recallersToDelete.map(recaller => {
            if (
                recaller.lifePeriod === LifePeriod.CONSTRUCTED ||
                recaller.lifePeriod === LifePeriod.STOPPED
            ) recallers.delete(recaller);
            else throw new Error('a running service cannot be deleted');
        })).then(() => {
            ctx.status = 204;
        }, err => {
            console.error(err);
            ctx.status = 405;
            ctx.message = err.message;
        });
    })

    .get('/list', (ctx, next) => {
        if (ctx.query.name) {
            const recaller = [...recallers].find(
                recaller => recaller.config.name === ctx.query.name
            );
            if (recaller) {
                ctx.body = getInfo(recaller);
            } else {
                ctx.status = 404;
                ctx.message = 'Service not found.';
            }
        } else ctx.body = [...recallers].map(getInfo);
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
    recallers.forEach(recaller => {
        recaller.kill();
    });
    process.exit(0);
});