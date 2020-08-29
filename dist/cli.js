#!/usr/bin/env -S node --experimental-specifier-resolution=node
import yargs from 'yargs';
import fetch from 'node-fetch';
import { PORT } from './config';
import { URL } from 'url';
import { resolve, dirname } from 'path';
import Controller from './controller';
import fse from 'fs-extra';
const { readJsonSync } = fse;
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
        default: ['--experimental-specifier-resolution=node'],
    },
    config: {
        alias: 'c',
        type: 'string',
    },
    stdout: {
        type: 'string',
    },
    stderr: {
        type: 'string',
    }
};
function configParser(path) {
    const config = readJsonSync(path);
    config.path = resolve(dirname(path), config.path);
    if (config.cwd)
        config.cwd = resolve(dirname(path), config.cwd);
    if (config.stdout)
        config.stdout = resolve(dirname(path), config.stdout);
    if (config.stderr)
        config.stderr = resolve(dirname(path), config.stderr);
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
}).command('start [name]', 'start a script as a daemon', yargs => {
    yargs
        .positional('name', {
        type: 'string',
        describe: 'name of the process',
    })
        .option(options)
        .config('config', configParser)
        .check(checker);
}, args => (async () => {
    if (!args.stdout)
        args.stdout = resolve(process.env.HOME, `./.epimetheus/log/${args.name}.log`);
    if (!args.stderr)
        args.stderr = resolve(process.env.HOME, `./.epimetheus/log/${args.name}.log`);
    const config = {
        name: args.name,
        path: resolve(process.cwd(), args.path),
        cwd: resolve(process.cwd(), args.cwd),
        args: args.args,
        nodeArgs: args.nodeArgs,
        stdout: resolve(process.cwd(), args.stdout),
        stderr: resolve(process.cwd(), args.stderr),
    };
    const res = await fetch(`http://localhost:${PORT}/start`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
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
    })
        .option(options)
        .config('config', configParser)
        .check(checker);
}, args => (async () => {
    const ctrler = new Controller({
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