import { ExecutionContext } from 'ava';
import { fork } from 'child_process';
import { LifePeriod } from 'startable';
import { once } from 'events';
import { STOP_SIGNAL } from '../../dist/config';
import Bluebird from 'bluebird';
const { delay } = Bluebird;

const soulmatePath = '/home/zim/projects/epimetheus/dist/soulmate.js';
const servicePath = '/home/zim/projects/epimetheus/test/build/service.js';
const dirPath = '/home/zim/projects/epimetheus/test/build';
const nodeArg = '--experimental-specifier-resolution=node';

export async function testSoulmateNormal(t: ExecutionContext<unknown>) {
    const subp = fork(
        soulmatePath,
        [servicePath, 'normal'],
        {
            cwd: dirPath,
            execArgv: [nodeArg],
            env: {
                ...process.env,
                epimetheus: 'true',
            },
            stdio: 'ignore',
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

export async function testSoulmateSelfStop(t: ExecutionContext<unknown>) {
    const subp = fork(
        soulmatePath,
        [servicePath, 'self stop'],
        {
            cwd: dirPath,
            execArgv: [nodeArg],
            env: {
                ...process.env,
                epimetheus: '',
            },
            stdio: 'ignore',
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

export async function testSoulmateFailed(t: ExecutionContext<unknown>) {
    const subp = fork(
        soulmatePath,
        [servicePath, 'failed'],
        {
            cwd: dirPath,
            execArgv: [nodeArg],
            env: {
                ...process.env,
                epimetheus: '',
            },
            stdio: 'ignore',
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

export async function testSoulmateBroken(t: ExecutionContext<unknown>) {
    const subp = fork(
        soulmatePath,
        [servicePath, 'broken'],
        {
            cwd: dirPath,
            execArgv: [nodeArg],
            env: {
                ...process.env,
                epimetheus: '',
            },
            stdio: 'ignore',
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

export async function testSoulmateSelfStopBroken(t: ExecutionContext<unknown>) {
    const subp = fork(
        soulmatePath,
        [servicePath, 'self stop broken'],
        {
            cwd: dirPath,
            execArgv: [nodeArg],
            env: {
                ...process.env,
                epimetheus: '',
            },
            stdio: 'ignore',
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