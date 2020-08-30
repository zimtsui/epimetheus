#!/usr/bin/env -S node --experimental-specifier-resolution=node --enable-source-maps
import yargs from 'yargs';
import fetch from 'node-fetch';
import { PORT } from './config';
import { URL } from 'url';
import { resolve, dirname } from 'path';
import Invoker from './invoker';
import fse from 'fs-extra';
import { format } from 'util';
const { readJsonSync } = fse;
const prefix = '[epi-cli] ';
console.log = (...args) => console.info(`${prefix}${format(...args)}`);
console.error = (...args) => console.warn(`${prefix}${format(...args)}`);
const options = {
    path: {
        describe: 'path of the script',
        type: 'string',
    },
    cwd: {
        describe: 'working directory of the process',
        type: 'string',
        default: process.cwd(),
    },
    args: {
        describe: 'arguments for the script',
        type: 'array',
        default: [],
    },
    'node-args': {
        describe: 'arguments for nodejs',
        type: 'array',
        default: [
            '--experimental-specifier-resolution=node',
            '--enable-source-maps',
        ],
    },
    config: {
        alias: 'c',
        type: 'string',
    },
    outFilePath: {
        type: 'string',
    },
    errFilePath: {
        type: 'string',
    }
};
function configParser(path) {
    const config = readJsonSync(path);
    config.path = resolve(dirname(path), config.path);
    if (config.cwd)
        config.cwd = resolve(dirname(path), config.cwd);
    if (config.outFilePath)
        config.outFilePath = resolve(dirname(path), config.outFilePath);
    if (config.errFilePath)
        config.errFilePath = resolve(dirname(path), config.errFilePath);
    return config;
}
function checker(args) {
    if (!args.name && !args.config)
        throw new Error('any of \"[name]\" and \"--config\" is expected.');
    if (!args.path && !args.config)
        throw new Error('any of \"--path\" and \"--config\" is expected.');
    return true;
}
yargs
    .strict()
    .parserConfiguration({
    "strip-aliased": true,
    "strip-dashed": true,
}).command('register [name]', 'register a script as a daemon', yargs => {
    yargs
        .positional('name', {
        type: 'string',
        describe: 'name of the process',
    })
        .option(options)
        .config('config', configParser)
        .check(checker);
}, args => (async () => {
    if (!args.outFilePath)
        args.outFilePath = resolve(process.env.HOME, `./.epimetheus/log/${args.name}.log`);
    if (!args.errFilePath)
        args.errFilePath = resolve(process.env.HOME, `./.epimetheus/log/${args.name}.log`);
    const config = {
        name: args.name,
        path: resolve(process.cwd(), args.path),
        cwd: resolve(process.cwd(), args.cwd),
        args: args.args,
        nodeArgs: args.nodeArgs,
        outFilePath: resolve(process.cwd(), args.outFilePath),
        errFilePath: resolve(process.cwd(), args.errFilePath),
    };
    const res = await fetch(`http://localhost:${PORT}/register`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
    });
    if (!res.ok)
        throw new Error(`${res.status}: ${res.statusText}`);
})().catch(console.error)).command('start <name>', 'start a registered daemon', yargs => {
}, args => (async () => {
    const url = new URL(`http://localhost:${PORT}/start?name=${args.name}`).href;
    const res = await fetch(url);
    if (!res.ok)
        throw new Error(`${res.status}: ${res.statusText}`);
})().catch(console.error)).command('stop [name]', 'stop a/all registered daemons', yargs => {
}, args => (async () => {
    const url = new URL(args.name
        ? `http://localhost:${PORT}/stop?name=${args.name}`
        : `http://localhost:${PORT}/stop`).href;
    const res = await fetch(url);
    if (!res.ok)
        throw new Error(`${res.status}: ${res.statusText}\n${await res.text()}`);
})().catch(console.error)).command('delete [name]', 'delete a/all registries', yargs => {
}, args => (async () => {
    const url = new URL(args.name
        ? `http://localhost:${PORT}/delete?name=${args.name}`
        : `http://localhost:${PORT}/delete`).href;
    const res = await fetch(url);
    if (!res.ok)
        throw new Error(`${res.status}: ${res.statusText}`);
})().catch(console.error)).command('run [name]', 'start a script synchronously', yargs => {
    yargs
        .positional('name', {
        type: 'string',
        describe: 'name of the process',
    })
        .option(options)
        .config('config', configParser)
        .check(checker);
}, args => (async () => {
    const invoker = new Invoker({
        name: args.name,
        path: resolve(process.cwd(), args.path),
        cwd: resolve(process.cwd(), args.cwd),
        args: args.args,
        nodeArgs: args.nodeArgs,
        stdout: 'inherit',
        stderr: 'inherit',
    });
    process.once('SIGINT', () => {
        process.once('SIGINT', () => {
            process.exit(1);
        });
        console.log('\nreceived SIGINT');
        console.log('send SIGINT again to terminate immediately.');
        invoker.stop().catch(console.error);
    });
    console.log('starting...');
    return invoker.start(err => {
        if (err)
            console.error(err);
        console.log('stopping...');
    }).then(() => console.log('started.'));
})().catch(console.error)).command('list [name]', 'show status of processes', yargs => {
    yargs
        .positional('name', {
        type: 'string',
        describe: 'name of the process',
    });
}, args => (async () => {
    const url = new URL(args.name
        ? `http://localhost:${PORT}/list?name=${args.name}`
        : `http://localhost:${PORT}/list?`).href;
    const res = await fetch(url);
    if (!res.ok)
        throw new Error(`${res.status}: ${res.statusText}`);
    console.log(await res.json());
})().catch(console.error)).parse();
//# sourceMappingURL=cli.js.map