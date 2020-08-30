import {
    testInvokeeNormal,
    testInvokeeSelfStop,
    testInvokeeFailed,
    testInvokeeBroken,
    testInvokeeSelfStopBroken,
} from './test-invokee';
import {
    testInvokerNormal,
    testInvokerSelfStop,
    testInvokerFailed,
    testInvokerBroken,
    testInvokerSelfStopBroken,
} from './test-invoker';
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