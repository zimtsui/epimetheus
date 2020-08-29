#!/usr/bin/env -S node --experimental-specifier-resolution=node
import yargs from 'yargs';
import fetch from 'node-fetch';
import { PORT } from './config';
import { URL, fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
import Controller from './controller';
import fse from 'fs-extra';
const { assert } = console;
const { readJsonSync } = fse;
yargs
    .strict()
    .parserConfiguration({
    "strip-aliased": true,
    "strip-dashed": true,
})
    .command('start <name>', 'start a script as a daemon', yargs => {
    yargs
        .positional('name', {
        type: 'string',
        describe: 'name of the process',
    }).option({
        path: {
            demandOption: true,
            describe: 'path of the script',
            type: 'string',
        },
        cwd: {
            describe: 'working directory of the process',
            type: 'string',
        },
        args: {
            describe: 'arguments for the script',
            type: 'array',
        },
        'node-args': {
            describe: 'arguments for nodejs',
            type: 'array',
        }
    }).config((path) => readJsonSync(path));
}, args => (async () => {
    const res = await fetch(`http://localhost:${PORT}/start`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: args.name,
            path: resolve(dirname(fileURLToPath(args.config)), args.path),
            cwd: args.cwd
                ? resolve(dirname(fileURLToPath(args.config)), args.cwd)
                : process.cwd(),
            args: args.args || [],
            nodeArgs: args.nodeArgs || ['--experimental-specifier-resolution=node'],
        }),
    });
    if (!res.ok)
        throw new Error(`${res.status}: ${res.statusText}`);
})().catch(console.error)).command('stop [name]', 'stop a daemon', yargs => {
}, args => (async () => {
    const url = new URL(args.name
        ? `http://localhost:${PORT}/stop?name=${args.name}`
        : `http://localhost:${PORT}/stop`).href;
    const res = await fetch(url);
    if (!res.ok)
        throw new Error(`${res.status}: ${res.statusText}`);
})().catch(console.error)).command('run [name]', 'start a script synchronously', yargs => {
    yargs
        .positional('name', {
        type: 'string',
        describe: 'name of the process',
    }).option({
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
            default: ['--experimental-specifier-resolution=node'],
        },
        config: {
            alias: 'c',
            type: 'string',
        },
    }).config('config', (path) => {
        const config = readJsonSync(path);
        assert(config.name);
        assert(config.path);
        config.path = resolve(dirname(path), config.path);
        if (config.cwd)
            config.cwd = resolve(dirname(path), config.cwd);
        return config;
    }).check((args) => {
        console.log(args);
        if (!args.name && !args.config)
            throw new Error('any of \"[name]\" and \"--config\" is expected.');
        if (!args.path && !args.config)
            throw new Error('any of \"--path\" and \"--config\" is expected.');
        return true;
    });
}, args => (async () => {
    const ctrler = new Controller({
        name: args.name,
        path: resolve(process.cwd(), args.path),
        cwd: resolve(process.cwd(), args.cwd),
        args: args.args,
        nodeArgs: args.nodeArgs,
    });
    process.once('SIGINT', () => {
        process.once('SIGINT', () => {
            process.exit(1);
        });
        console.log('\nreceived SIGINT');
        console.log('send SIGINT again to terminate immediately.');
        ctrler.stop().catch(console.error);
    });
    console.log('starting...');
    return ctrler.start(err => {
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