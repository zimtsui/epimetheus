import { Config } from './interfaces';
import { LifePeriod } from 'startable';
import { Controller } from './controller';

interface Info extends Config {
    status: LifePeriod;
}

function getInfo(ctrler: Controller): Info {
    return {
        ...ctrler.config,
        status: ctrler.lifePeriod,
    };
}

export {
    getInfo as default,
    getInfo,
    Info,
}