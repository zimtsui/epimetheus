#!/usr/bin/env -S node --experimental-specifier-resolution=node
import yargs from 'yargs';
import fetch from 'node-fetch';
import { PORT } from './config';
import { URL } from 'url';
import Controller from './controller';
yargs.command('start <name>', 'start a script as a daemon', yargs => {
    yargs
        .positional('name', {
        type: 'string',
        describe: 'name of the process',
    }).option('path', {
        demandOption: true,
        describe: 'path of the script',
        type: 'string',
    });
}, args => (async () => {
    const res = await fetch(`http://localhost:${PORT}/start`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: args.name,
            servicePath: args.path,
            cwd: process.cwd(),
            args: [],
            nodeArgs: ['--experimental-specifier-resolution=node'],
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
})().catch(console.error)).command('run <name>', 'start a script synchronously', yargs => {
    yargs
        .positional('name', {
        type: 'string',
        describe: 'name of the process',
    }).option('path', {
        demandOption: true,
        describe: 'path of the script',
        type: 'string',
    });
}, args => (async () => {
    const ctrler = new Controller({
        name: args.name,
        servicePath: args.path,
        cwd: process.cwd(),
        args: [],
        nodeArgs: ['--experimental-specifier-resolution=node'],
    });
    process.once('SIGINT', () => {
        console.log('\nreceived SIGINT');
        console.log('send SIGINT again to terminate immediately.');
        process.once('SIGINT', () => {
            process.exit(1);
        });
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