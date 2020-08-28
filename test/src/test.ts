import {
    testSoulmateNormal,
    testSoulmateSelfStop,
    testSoulmateFailed,
    testSoulmateBroken,
    testSoulmateSelfStopBroken,
} from './test-soulmate';
import {
    testControllerNormal,
    testControllerSelfStop,
    testControllerFailed,
    testControllerBroken,
    testControllerSelfStopBroken,
} from './test-controller';
import test from 'ava';

test('soulmate normal', testSoulmateNormal);
test('soulmate self stop', testSoulmateSelfStop);
test('soulmate failed', testSoulmateFailed);
test('soulmate broken', testSoulmateBroken);
test('soulmate self stop broken', testSoulmateSelfStopBroken);

test('controller normal', testControllerNormal);
test('controller self stop', testControllerSelfStop);
test('controller failed', testControllerFailed);
test('controller broken', testControllerBroken);
test('controller self stop broken', testControllerSelfStopBroken);