import { describe, it, expect, jest } from '@jest/globals';
import { createEventBus } from '../../src/core/event-bus.js';

type TestEvents = {
  foo: { value: number };
};

describe('event bus', () => {
  it('publishes events to subscribers', () => {
    const bus = createEventBus<TestEvents>();
    const handler = jest.fn();
    bus.subscribe('foo', handler);
    bus.publish('foo', { value: 42 });

    expect(handler).toHaveBeenCalledWith({ value: 42 });
  });

  it('does not call unsubscribed handlers', () => {
    const bus = createEventBus<TestEvents>();
    const handler = jest.fn();
    bus.subscribe('foo', handler);
    bus.unsubscribe('foo', handler);
    bus.publish('foo', { value: 1 });

    expect(handler).not.toHaveBeenCalled();
  });
});
