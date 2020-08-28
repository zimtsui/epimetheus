import { fork } from 'child_process';
import { once } from 'events';
import { STOP_SIGNAL } from '../../dist/config';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
const sleep = promisify(setTimeout);
const packagePath = resolve(fileURLToPath(dirname(import.meta.url)), '../..');
const soulmatePath = resolve(packagePath, './dist/soulmate.js');
const servicePath = resolve(packagePath, './test/build/service.js');
const workingDirPath = resolve(packagePath, './test/build');
const nodeArg = '--experimental-specifier-resolution=node';
const stdio = process.env.NODE_ENV === 'test' ? 'ignore' : 'inherit';
export async function testSoulmateNormal(t) {
    const subp = fork(soulmatePath, [servicePath, 'normal'], {
        cwd: workingDirPath,
        execArgv: [nodeArg],
        env: {
            ...process.env,
            epimetheus: 'true',
        },
        stdio,
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
        cwd: workingDirPath,
        execArgv: [nodeArg],
        env: {
            ...process.env,
            epimetheus: '',
        },
        stdio,
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
        cwd: workingDirPath,
        execArgv: [nodeArg],
        env: {
            ...process.env,
            epimetheus: '',
        },
        stdio,
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
        cwd: workingDirPath,
        execArgv: [nodeArg],
        env: {
            ...process.env,
            epimetheus: '',
        },
        stdio,
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
        cwd: workingDirPath,
        execArgv: [nodeArg],
        env: {
            ...process.env,
            epimetheus: '',
        },
        stdio,
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