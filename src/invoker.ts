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

router.post('/register', async (ctx, next) => {
    const sConfig: SerializableConfig = ctx.request.body;
    const config: ControllerConfig = {
        ...sConfig,
        createStdout: () => {
            ensureFileSync(sConfig.outFilePath);
            return createWriteStream(sConfig.outFilePath, { flags: 'a' });
        },
        createStderr: () => {
            ensureFileSync(sConfig.errFilePath);
            return createWriteStream(sConfig.errFilePath, { flags: 'a' });
        },
    };
    if (![...ctrlers].find(ctrler => ctrler.config.name === config.name)) {
        ctx.status = 204;
        const ctrler = new Controller(config);
        ctrlers.add(ctrler);
    } else {
        // TODO text, code
        ctx.status = 404;
    }
});

router.get('/start', async (ctx, next) => {
    const name = <string>ctx.query.name;
    const ctrler = [...ctrlers].find(ctrler => ctrler.config.name === name);
    if (ctrler) {
        ctrler.config.stdout = ctrler.config.createStdout!();
        ctrler.config.stderr = ctrler.config.createStderr!();
        await once(<WriteStream>ctrler.config.stdout, 'open');
        await once(<WriteStream>ctrler.config.stderr, 'open');
        async function onStop(err?: Error) {
            (<WriteStream>ctrler!.config.stderr).write(`${format(err)}\n`);
            if (await ctrler!.started!.then(() => true, () => false))
                ctrler!.stopped!.then(() => {
                    if (ctrler!.shouldBeRunning) ctrler!.start(onStop).catch(() => { });
                }, err => { });
            else {
                ctrler!.stopped!.then(() => {
                    (<WriteStream>ctrler!.config.stdout).end();
                    (<WriteStream>ctrler!.config.stderr).end();
                }, err => { });
            }
        }
        await ctrler.start(onStop).then(() => {
            ctx.status = 204;
        }, err => {
            ctrlers.delete(ctrler);
            ctx.status = 404;
        });
    } else {
        ctx.status = 404;
    }
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
        (<WriteStream>ctrler.config.stdout).end();
        (<WriteStream>ctrler.config.stderr).end();
    }));
    ctx.status = 204;
});

router.get('/delete', async (ctx, next) => {
    const name = <string>ctx.query.name;
    let ctrlersToDelete: Controller[];
    if (name) {
        const ctrler = [...ctrlers].find(ctrler => ctrler.config.name === name);
        if (ctrler) ctrlersToDelete = [ctrler];
        else {
            ctx.status = 404;
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