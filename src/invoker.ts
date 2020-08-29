#!/usr/bin/env -S node --experimental-specifier-resolution=node
import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import Controller from './controller';
import { SerializableConfig, ControllerConfig, } from './interfaces';
import { PORT } from './config';
import getInfo from './getInfo';
import { createWriteStream, WriteStream } from 'fs';
import fse from 'fs-extra';
import { format } from 'util';
import { once } from 'events';
import { LifePeriod } from 'startable';
const { ensureFileSync } = fse;

const server = new Koa();
const router = new Router();

const ctrlers = new Set<Controller>();

router
    .post('/register', async (ctx, next) => {
        const config: ControllerConfig = <SerializableConfig>ctx.request.body;
        if (![...ctrlers].find(ctrler => ctrler.config.name === config.name)) {
            ctx.status = 201;
            const ctrler = new Controller(config);
            ctrlers.add(ctrler);
        } else {
            ctx.status = 405;
            ctx.message = 'Service already existing.'
        }
    })

    .get('/start', async (ctx, next) => {
        const name = <string>ctx.query.name;
        const ctrler = [...ctrlers].find(ctrler => ctrler.config.name === name);
        if (ctrler) {
            ensureFileSync(ctrler.config.outFilePath!);
            ensureFileSync(ctrler.config.errFilePath!);
            ctrler.config.stdout = createWriteStream(ctrler.config.outFilePath!, { flags: 'a' });
            ctrler.config.stderr = createWriteStream(ctrler.config.errFilePath!, { flags: 'a' });
            await once(<WriteStream>ctrler.config.stdout, 'open');
            await once(<WriteStream>ctrler.config.stderr, 'open');

            function onStop(err?: Error) {
                if (err) (<WriteStream>ctrler!.config.stderr).write(`${format(err)}\n`);
                ctrler!.stopped!.then(async () => {
                    if (
                        await ctrler!.started!.then(() => true, () => false) &&
                        ctrler!.shouldBeRunning
                    )
                        ctrler!.start(onStop).catch(() => { });
                    else {
                        (<WriteStream>ctrler!.config.stdout).end();
                        (<WriteStream>ctrler!.config.stderr).end();
                    }
                }, err => {
                    console.error(err);
                    (<WriteStream>ctrler!.config.stdout).end();
                    (<WriteStream>ctrler!.config.stderr).end();
                });
            }
            await ctrler.start(onStop).then(() => {
                ctx.status = 204;
            }, err => {
                // err 在 onStop() 中处理
                ctx.status = 503;
                ctx.message = 'Failed to start.'
            });
        } else {
            ctx.status = 404;
            ctx.message = 'Service not found.';
        }
    })

    .get('/stop', async (ctx, next) => {
        const name = <string>ctx.query.name;
        let ctrlersToStop: Controller[];
        if (name) {
            const ctrler = [...ctrlers].find(ctrler => ctrler.config.name === name);
            if (ctrler) ctrlersToStop = [ctrler];
            else {
                ctx.status = 404;
                ctx.message = 'Service not found.';
                return;
            }
        } else ctrlersToStop = [...ctrlers];

        await Promise.all(ctrlersToStop.map(async ctrler => {
            ctrler.shouldBeRunning = false;
            // stop() 的异常在 onStop() 中处理
            await ctrler.stop();
        })).catch(err => {
            ctx.status = 500;
            ctx.message = 'Failed to stop.'
            throw err;
        });
        ctx.status = 204;
    })

    .get('/delete', async (ctx, next) => {
        const name = <string>ctx.query.name;
        let ctrlersToDelete: Controller[];
        if (name) {
            const ctrler = [...ctrlers].find(ctrler => ctrler.config.name === name);
            if (ctrler) ctrlersToDelete = [ctrler];
            else {
                ctx.status = 404;
                ctx.message = 'Service not found.';
                return;
            }
        } else ctrlersToDelete = [...ctrlers];

        await Promise.all(ctrlersToDelete.map(ctrler => {
            if (
                ctrler.lifePeriod === LifePeriod.CONSTRUCTED ||
                ctrler.lifePeriod === LifePeriod.STOPPED ||
                ctrler.lifePeriod === LifePeriod.BROKEN
            ) ctrlers.delete(ctrler);
            else throw new Error('a running service cannot be deleted');
        })).catch((err: Error) => {
            ctx.status = 405;
            ctx.message = err.message;
            throw err;
        });
        ctx.status = 204;
    })

    .get('/list', (ctx, next) => {
        if (ctx.query.name) {
            const ctrler = [...ctrlers].find(
                ctrler => ctrler.config.name === ctx.query.name
            );
            if (ctrler) {
                ctx.body = getInfo(ctrler);
            } else {
                ctx.status = 404;
                ctx.message = 'Service not found.';
            }
        } else ctx.body = [...ctrlers].map(getInfo);
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
    ctrlers.forEach(ctrler => {
        ctrler.subp.on('error', console.error);
        ctrler.subp.kill('SIGKILL');
    });
    process.exit(0);
});