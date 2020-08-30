import { Invoker } from '../../dist/invoker';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { DEFAULT_STOP_TIMEOUT } from '../../dist/config';
chai.use(chaiAsPromised);
const { assert } = chai;
const path = '/home/zim/projects/epimetheus/test/build/service.js';
const dirPath = '/home/zim/projects/epimetheus/test/build';
const nodeArg = '--experimental-specifier-resolution=node';
export async function testInvokerNormal(t) {
    const invoker = new Invoker({
        name: t.title,
        path: path,
        cwd: dirPath,
        args: ['normal'],
        nodeArgs: [nodeArg],
        stdout: 'ignore',
        stderr: 'ignore',
        STOP_TIMEOUT: DEFAULT_STOP_TIMEOUT,
    });
    await invoker.start(err => {
        assert.isUndefined(err);
    });
    await invoker.stop();
}
export async function testInvokerSelfStop(t) {
    const invoker = new Invoker({
        name: t.title,
        path: path,
        cwd: dirPath,
        args: ['self stop'],
        nodeArgs: [nodeArg],
        stdout: 'ignore',
        stderr: 'ignore',
        STOP_TIMEOUT: DEFAULT_STOP_TIMEOUT,
    });
    let p1;
    let p2;
    p2 = new Promise(resolve => {
        p1 = invoker.start(err => {
            assert(err instanceof Error);
            resolve(invoker.stopped);
        });
    });
    await p1;
    await p2;
}
export async function testInvokerFailed(t) {
    const invoker = new Invoker({
        name: t.title,
        path: path,
        cwd: dirPath,
        args: ['failed'],
        nodeArgs: [nodeArg],
        stdout: 'ignore',
        stderr: 'ignore',
        STOP_TIMEOUT: DEFAULT_STOP_TIMEOUT,
    });
    await assert.isRejected(invoker.start());
    await invoker.stop();
}
export async function testInvokerBroken(t) {
    const invoker = new Invoker({
        name: t.title,
        path: path,
        cwd: dirPath,
        args: ['broken'],
        nodeArgs: [nodeArg],
        stdout: 'ignore',
        stderr: 'ignore',
        STOP_TIMEOUT: DEFAULT_STOP_TIMEOUT,
    });
    await invoker.start();
    await invoker.stop();
}
export async function testInvokerSelfStopBroken(t) {
    const invoker = new Invoker({
        name: t.title,
        path: path,
        cwd: dirPath,
        args: ['self stop broken'],
        nodeArgs: [nodeArg],
        stdout: 'ignore',
        stderr: 'ignore',
        STOP_TIMEOUT: DEFAULT_STOP_TIMEOUT,
    });
    let p1;
    let p2;
    p2 = new Promise(resolve => {
        p1 = invoker.start(err => {
            assert(err instanceof Error);
            resolve(invoker.stopped);
        });
    });
    await p1;
    await p2;
}
//# sourceMappingURL=test-invoker.js.map