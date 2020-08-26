import { fork } from 'child_process';
import { once } from 'events';
import { STOP_SIGNAL } from '../../dist/config';
import Bluebird from 'bluebird';
const { delay } = Bluebird;
const soulmatePath = '/home/zim/projects/epimetheus/dist/soulmate.js';
const servicePath = '/home/zim/projects/epimetheus/test/build/service.js';
const dirPath = '/home/zim/projects/epimetheus/test/build';
const nodeArg = '--experimental-specifier-resolution=node';
export async function testSoulmateNormal(t) {
    const subp = fork(soulmatePath, [servicePath, 'normal'], {
        cwd: dirPath,
        execArgv: [nodeArg],
        env: {
            ...process.env,
            epimetheus: 'true',
        },
        stdio: 'ignore',
    });
    await new Promise(resolve => {
        subp.on('message', message => {
            if (message === 2 /* STARTED */)
                resolve();
        });
    });
    subp.kill(STOP_SIGNAL);
    await new Promise(resolve => {
        subp.on('message', message => {
            if (message === 4 /* STOPPING */)
                resolve();
        });
    });
    await once(subp, 'exit');
}
export async function testSoulmateSelfStop(t) {
    const subp = fork(soulmatePath, [servicePath, 'self stop'], {
        cwd: dirPath,
        execArgv: [nodeArg],
        env: {
            ...process.env,
            epimetheus: '',
        },
        stdio: 'ignore',
    });
    await Promise.all([
        new Promise(resolve => {
            subp.on('message', message => {
                if (message === 2 /* STARTED */)
                    resolve();
            });
        }),
        new Promise(resolve => {
            subp.on('message', message => {
                if (message === 4 /* STOPPING */)
                    resolve();
            });
        }),
        once(subp, 'exit'),
    ]);
}
export async function testSoulmateFailed(t) {
    const subp = fork(soulmatePath, [servicePath, 'failed'], {
        cwd: dirPath,
        execArgv: [nodeArg],
        env: {
            ...process.env,
            epimetheus: '',
        },
        stdio: 'ignore',
    });
    await Promise.all([
        new Promise(resolve => {
            subp.on('message', message => {
                if (message === 3 /* FAILED */)
                    resolve();
            });
        }),
        await new Promise(resolve => {
            subp.on('message', message => {
                if (message === 4 /* STOPPING */)
                    resolve();
            });
        }),
    ]);
    await once(subp, 'exit');
}
export async function testSoulmateBroken(t) {
    const subp = fork(soulmatePath, [servicePath, 'broken'], {
        cwd: dirPath,
        execArgv: [nodeArg],
        env: {
            ...process.env,
            epimetheus: '',
        },
        stdio: 'ignore',
    });
    await new Promise(resolve => {
        subp.on('message', message => {
            if (message === 2 /* STARTED */)
                resolve();
        });
    });
    subp.kill(STOP_SIGNAL);
    await new Promise(resolve => {
        subp.on('message', message => {
            if (message === 4 /* STOPPING */)
                resolve();
        });
    });
    await once(subp, 'exit');
}
export async function testSoulmateSelfStopBroken(t) {
    const subp = fork(soulmatePath, [servicePath, 'self stop broken'], {
        cwd: dirPath,
        execArgv: [nodeArg],
        env: {
            ...process.env,
            epimetheus: '',
        },
        stdio: 'ignore',
    });
    await Promise.all([
        new Promise(resolve => {
            subp.on('message', message => {
                if (message === 2 /* STARTED */)
                    resolve();
            });
        }),
        await new Promise(resolve => {
            subp.on('message', message => {
                if (message === 4 /* STOPPING */)
                    resolve();
            });
        }),
    ]);
    await once(subp, 'exit');
}
//# sourceMappingURL=test-soulmate.js.map