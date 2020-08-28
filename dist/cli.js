#!/usr/bin/env -S node --experimental-specifier-resolution=node
import yargs from 'yargs';
import fetch from 'node-fetch';
import { PORT } from './config';
import { URL } from 'url';
import Controller from './controller';
yargs
    .command('start <name>', 'start a script as a daemon', yargs => {
    yargs
        .positional('name', {
        type: 'string',
        describe: 'name of the process',
    }).option('path', {
        demandOption: true,
        describe: 'path of the script',
        type: 'string',
    });
}, args => {
    return fetch(`http://localhost:${PORT}/start`, {
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
}).command('stop <name>', 'stop a daemon', yargs => {
}, args => {
    const url = new URL(`http://localhost:${PORT}/stop?name=${args.name}`).href;
    return fetch(url);
}).command('run <name>', 'start a script synchronously', yargs => {
    yargs
        .positional('name', {
        type: 'string',
        describe: 'name of the process',
    }).option('path', {
        demandOption: true,
        describe: 'path of the script',
        type: 'string',
    });
}, args => {
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
    return ctrler.start(err => {
        if (err)
            console.error(err);
        console.log('stopping...');
    }).catch(console.error);
}).parse();
//# sourceMappingURL=cli.js.map