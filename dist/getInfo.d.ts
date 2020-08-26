import { Config } from './interfaces';
import { LifePeriod } from 'startable';
import { Controller } from './controller';
interface Info extends Config {
    status: LifePeriod;
}
declare function getInfo(ctrler: Controller): Info;
export { getInfo as default, getInfo, Info, };
