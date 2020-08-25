import Koa from 'koa';
import Router from 'koa-router';
import { Startable, LifePeriod } from 'startable';
import { ChildProcess, fork } from 'child_process';
import {
    PORT,
    STOP_SIGNAL,
} from './config';

const daemon = new Koa();
const router = new Router();

interface Config {
    name: string;
    servicePath: string;
    cwd: string;
    args: string[];
    nodeArgs: string;
}

interface Info extends Config {
    status: LifePeriod;
    process: ChildProcess;
    messageListener: (msg: LifePeriod) => void;
    exitListener: (code: number | null, signal: NodeJS.Signals | null) => void;
}

const infos = new Set<Info>();

function startProcess(info: Info) {
    info.process = fork(
        info.servicePath,
        info.args,
        {
            cwd: info.cwd,
        }
    );
    infos.add(info);
    info.status = LifePeriod.STARTING;
    info.messageListener = msg => {
        if (msg === LifePeriod.STARTED) {
            info.status = LifePeriod.STARTED;
        }
        if (msg === LifePeriod.STOPPING) {
            info.status = LifePeriod.STOPPING;
        }
    };
    info.process.on('message', info.messageListener);
    info.exitListener = (code, signal) => {
        startProcess(info);
    };
    info.process.on('exit', info.exitListener);
}

router.post('/start', (ctx, next) => {
    const config: Config = ctx.body;
    startProcess(<Info>config);
    ctx.status = 200;
});

router.get('/stop', (ctx, next) => {
    const name = <string>ctx.params.name;
    // 容错
    const info = [...infos].find(config => config.name === name)!;
    info.process.kill(STOP_SIGNAL);
    info.process.off('exit', info.exitListener);
    info.process.on('exit', () => {
        infos.delete(info);
    });
    ctx.status = 200;
});

router.get('/list', (ctx, next) => {

});

daemon.use(router.routes());
daemon.listen(PORT);