import { Info } from './interfaces';
import { Invoker } from './invoker';

function getInfo(invoker: Invoker): Info {
    const { config } = invoker;
    return {
        name: config.name,
        path: config.path,
        cwd: config.cwd,
        args: config.args,
        nodeArgs: config.nodeArgs,
        status: invoker.lifePeriod,
    };
}

export {
    getInfo as default,
    getInfo,
    Info,
}