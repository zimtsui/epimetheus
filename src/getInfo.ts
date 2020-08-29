import { Info } from './interfaces';
import { Recaller } from './recaller';

function getInfo(recaller: Recaller): Info {
    const { config } = recaller;
    return {
        name: config.name,
        path: config.path,
        cwd: config.cwd,
        args: config.args,
        nodeArgs: config.nodeArgs,
        recallerStatus: recaller.lifePeriod,
        invokerStatus: recaller.invoker.lifePeriod,
    };
}

export {
    getInfo as default,
    getInfo,
    Info,
}