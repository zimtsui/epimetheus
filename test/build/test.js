import { testInvokeeNormal, testInvokeeSelfStop, testInvokeeFailed, testInvokeeBroken, testInvokeeSelfStopBroken, } from './test-invokee';
import test from 'ava';
test('invokee normal', testInvokeeNormal);
test('invokee self stop', testInvokeeSelfStop);
test('invokee failed', testInvokeeFailed);
test('invokee broken', testInvokeeBroken);
test('invokee self stop broken', testInvokeeSelfStopBroken);
// test('invoker normal', testInvokerNormal);
// test('invoker self stop', testInvokerSelfStop);
// test('invoker failed', testInvokerFailed);
// test('invoker broken', testInvokerBroken);
// test('invoker self stop broken', testInvokerSelfStopBroken);
//# sourceMappingURL=test.js.map