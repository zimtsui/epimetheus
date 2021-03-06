import { Controller } from '../../dist/controller';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const { assert } = chai;
const path = '/home/zim/projects/epimetheus/test/build/service.js';
const dirPath = '/home/zim/projects/epimetheus/test/build';
const nodeArg = '--experimental-specifier-resolution=node';
export async function testControllerNormal(t) {
    const ctrler = new Controller({
        name: t.title,
        path: path,
        cwd: dirPath,
        args: ['normal'],
        nodeArgs: [nodeArg],
        stdout: 'ignore',
        stderr: 'ignore',
    });
    await ctrler.start(err => {
        assert.isUndefined(err);
    });
    await ctrler.stop();
}
export async function testControllerSelfStop(t) {
    const ctrler = new Controller({
        name: t.title,
        path: path,
        cwd: dirPath,
        args: ['self stop'],
        nodeArgs: [nodeArg],
        stdout: 'ignore',
        stderr: 'ignore',
    });
    let p1;
    let p2;
    p2 = new Promise(resolve => {
        p1 = ctrler.start(err => {
            assert(err instanceof Error);
            resolve(ctrler.stopped);
        });
    });
    await p1;
    await p2;
}
export async function testControllerFailed(t) {
    const ctrler = new Controller({
        name: t.title,
        path: path,
        cwd: dirPath,
        args: ['failed'],
        nodeArgs: [nodeArg],
        stdout: 'ignore',
        stderr: 'ignore',
    });
    await assert.isRejected(ctrler.start());
    await ctrler.stop();
}
export async function testControllerBroken(t) {
    const ctrler = new Controller({
        name: t.title,
        path: path,
        cwd: dirPath,
        args: ['broken'],
        nodeArgs: [nodeArg],
        stdout: 'ignore',
        stderr: 'ignore',
    });
    await ctrler.start();
    await ctrler.stop();
}
export async function testControllerSelfStopBroken(t) {
    const ctrler = new Controller({
        name: t.title,
        path: path,
        cwd: dirPath,
        args: ['self stop broken'],
        nodeArgs: [nodeArg],
        stdout: 'ignore',
        stderr: 'ignore',
    });
    let p1;
    let p2;
    p2 = new Promise(resolve => {
        p1 = ctrler.start(err => {
            assert(err instanceof Error);
            resolve(ctrler.stopped);
        });
    });
    await p1;
    await p2;
}
//# sourceMappingURL=test-controller.js.map