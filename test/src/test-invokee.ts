import { ExecutionContext } from 'ava';
import { fork } from 'child_process';
import { LifePeriod } from 'startable';
import { once } from 'events';
import { STOP_SIGNAL } from '../../dist/config';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const packagePath = resolve(fileURLToPath(dirname(import.meta.url)), '../..');
const soulmatePath = resolve(packagePath, './dist/invokee.js');
const servicePath = resolve(packagePath, './test/build/service.js');
const workingDirPath = resolve(packagePath, './test/build');
const nodeArg = '--experimental-specifier-resolution=node';
const stdio = process.env.NODE_ENV === 'test' ? 'ignore' : 'inherit';

export async function testInvokeeNormal(t: ExecutionContext<unknown>) {
    const subp = fork(
        soulmatePath,
        [servicePath, 'normal'],
        {
            cwd: workingDirPath,
            execArgv: [nodeArg],
            env: {
                ...process.env,
                epimetheus: 'true',
            },
            stdio,
        }
    );
    await new Promise(resolve => {
        subp.on('message', message => {
            if (message === LifePeriod.STARTED) resolve();
        });
    });
    subp.kill(STOP_SIGNAL);
    await new Promise(resolve => {
        subp.on('message', message => {
            if (message === LifePeriod.STOPPING) resolve();
        })
    });
    await once(subp, 'exit');
}

export async function testInvokeeSelfStop(t: ExecutionContext<unknown>) {
    const subp = fork(
        soulmatePath,
        [servicePath, 'self stop'],
        {
            cwd: workingDirPath,
            execArgv: [nodeArg],
            env: {
                ...process.env,
                epimetheus: '',
            },
            stdio,
        }
    );
    await Promise.all([
        new Promise(resolve => {
            subp.on('message', message => {
                if (message === LifePeriod.STARTED) resolve();
            });
        }),
        new Promise(resolve => {
            subp.on('message', message => {
                if (message === LifePeriod.STOPPING) resolve();
            })
        }),
        once(subp, 'exit'),
    ]);
}

export async function testInvokeeFailed(t: ExecutionContext<unknown>) {
    const subp = fork(
        soulmatePath,
        [servicePath, 'failed'],
        {
            cwd: workingDirPath,
            execArgv: [nodeArg],
            env: {
                ...process.env,
                epimetheus: '',
            },
            stdio,
        }
    );
    await Promise.all([
        new Promise(resolve => {
            subp.on('message', message => {
                if (message === LifePeriod.FAILED) resolve();
            });
        }),
        await new Promise(resolve => {
            subp.on('message', message => {
                if (message === LifePeriod.STOPPING) resolve();
            })
        }),
    ]);
    await once(subp, 'exit');
}

export async function testInvokeeBroken(t: ExecutionContext<unknown>) {
    const subp = fork(
        soulmatePath,
        [servicePath, 'broken'],
        {
            cwd: workingDirPath,
            execArgv: [nodeArg],
            env: {
                ...process.env,
                epimetheus: '',
            },
            stdio,
        }
    );
    await new Promise(resolve => {
        subp.on('message', message => {
            if (message === LifePeriod.STARTED) resolve();
        });
    });
    subp.kill(STOP_SIGNAL);
    await new Promise(resolve => {
        subp.on('message', message => {
            if (message === LifePeriod.STOPPING) resolve();
        })
    });
    await once(subp, 'exit');
}

export async function testInvokeeSelfStopBroken(t: ExecutionContext<unknown>) {
    const subp = fork(
        soulmatePath,
        [servicePath, 'self stop broken'],
        {
            cwd: workingDirPath,
            execArgv: [nodeArg],
            env: {
                ...process.env,
                epimetheus: '',
            },
            stdio,
        }
    );
    await Promise.all([
        new Promise(resolve => {
            subp.on('message', message => {
                if (message === LifePeriod.STARTED) resolve();
            });
        }),
        await new Promise(resolve => {
            subp.on('message', message => {
                if (message === LifePeriod.STOPPING) resolve();
            })
        }),
    ]);
    await once(subp, 'exit');
}