import { fork } from 'child_process';
import { once } from 'events';
import { STOP_SIGNAL, DEFAULT_STOP_TIMEOUT } from '../../dist/config';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const packagePath = resolve(fileURLToPath(dirname(import.meta.url)), '../..');
const soulmatePath = resolve(packagePath, './dist/invokee.js');
const servicePath = resolve(packagePath, './test/build/service.js');
const workingDirPath = resolve(packagePath, './test/build');
const nodeArg = '--experimental-specifier-resolution=node';
const stdio = process.env.NODE_ENV === 'test' ? 'ignore' : 'inherit';
export async function testInvokeeNormal(t) {
    const subp = fork(soulmatePath, [servicePath, 'normal'], {
        cwd: workingDirPath,
        execArgv: [nodeArg],
        env: {
            ...process.env,
            EPIMETHEUS: 'true',
            STOP_TIMEOUT: `${DEFAULT_STOP_TIMEOUT}`,
        },
        stdio,
    });
    await new Promise(resolve => {
        subp.on('message', message => {
            if (message === "STARTED" /* STARTED */)
                resolve();
        });
    });
    subp.kill(STOP_SIGNAL);
    await new Promise(resolve => {
        subp.on('message', message => {
            if (message === "STOPPING" /* STOPPING */)
                resolve();
        });
    });
    await once(subp, 'exit');
}
export async function testInvokeeSelfStop(t) {
    const subp = fork(soulmatePath, [servicePath, 'self stop'], {
        cwd: workingDirPath,
        execArgv: [nodeArg],
        env: {
            ...process.env,
            EPIMETHEUS: 'true',
            STOP_TIMEOUT: `${DEFAULT_STOP_TIMEOUT}`,
        },
        stdio,
    });
    await Promise.all([
        new Promise(resolve => {
            subp.on('message', message => {
                if (message === "STARTED" /* STARTED */)
                    resolve();
            });
        }),
        new Promise(resolve => {
            subp.on('message', message => {
                if (message === "STOPPING" /* STOPPING */)
                    resolve();
            });
        }),
        once(subp, 'exit'),
    ]);
}
export async function testInvokeeFailed(t) {
    const subp = fork(soulmatePath, [servicePath, 'failed'], {
        cwd: workingDirPath,
        execArgv: [nodeArg],
        env: {
            ...process.env,
            EPIMETHEUS: 'true',
            STOP_TIMEOUT: `${DEFAULT_STOP_TIMEOUT}`,
        },
        stdio,
    });
    await Promise.all([
        new Promise(resolve => {
            subp.on('message', message => {
                if (message === "FAILED" /* FAILED */)
                    resolve();
            });
        }),
        await new Promise(resolve => {
            subp.on('message', message => {
                if (message === "STOPPING" /* STOPPING */)
                    resolve();
            });
        }),
    ]);
    await once(subp, 'exit');
}
export async function testInvokeeBroken(t) {
    const subp = fork(soulmatePath, [servicePath, 'broken'], {
        cwd: workingDirPath,
        execArgv: [nodeArg],
        env: {
            ...process.env,
            EPIMETHEUS: 'true',
            STOP_TIMEOUT: `${DEFAULT_STOP_TIMEOUT}`,
        },
        stdio,
    });
    await new Promise(resolve => {
        subp.on('message', message => {
            if (message === "STARTED" /* STARTED */)
                resolve();
        });
    });
    subp.kill(STOP_SIGNAL);
    await new Promise(resolve => {
        subp.on('message', message => {
            if (message === "STOPPING" /* STOPPING */)
                resolve();
        });
    });
    await once(subp, 'exit');
}
export async function testInvokeeSelfStopBroken(t) {
    const subp = fork(soulmatePath, [servicePath, 'self stop broken'], {
        cwd: workingDirPath,
        execArgv: [nodeArg],
        env: {
            ...process.env,
            EPIMETHEUS: 'true',
            STOP_TIMEOUT: `${DEFAULT_STOP_TIMEOUT}`,
        },
        stdio,
    });
    await Promise.all([
        new Promise(resolve => {
            subp.on('message', message => {
                if (message === "STARTED" /* STARTED */)
                    resolve();
            });
        }),
        await new Promise(resolve => {
            subp.on('message', message => {
                if (message === "STOPPING" /* STOPPING */)
                    resolve();
            });
        }),
    ]);
    await once(subp, 'exit');
}
//# sourceMappingURL=test-invokee.js.map