import { testSoulmateNormal, testSoulmateSelfStop, testSoulmateFailed, testSoulmateBroken, testSoulmateSelfStopBroken, } from './test-invokee';
import { testInvokerNormal, testInvokerSelfStop, testInvokerFailed, testInvokerBroken, testInvokerSelfStopBroken, } from './test-invoker';
import test from 'ava';
test('soulmate normal', testSoulmateNormal);
test('soulmate self stop', testSoulmateSelfStop);
test('soulmate failed', testSoulmateFailed);
test('soulmate broken', testSoulmateBroken);
test('soulmate self stop broken', testSoulmateSelfStopBroken);
test('invoker normal', testInvokerNormal);
test('invoker self stop', testInvokerSelfStop);
test('invoker failed', testInvokerFailed);
test('invoker broken', testInvokerBroken);
test('invoker self stop broken', testInvokerSelfStopBroken);
//# sourceMappingURL=test.js.map