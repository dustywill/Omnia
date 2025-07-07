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

  it('calls multiple handlers subscribed to the same event', () => {
    const bus = createEventBus<TestEvents>();
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    bus.subscribe('foo', handler1);
    bus.subscribe('foo', handler2);
    bus.publish('foo', { value: 100 });

    expect(handler1).toHaveBeenCalledWith({ value: 100 });
    expect(handler2).toHaveBeenCalledWith({ value: 100 });
  });

  it('calls handlers subscribed to different events', () => {
    const bus = createEventBus<TestEvents>();
    const handlerFoo = jest.fn();
    const handlerBar = jest.fn();
    bus.subscribe('foo', handlerFoo);
    bus.subscribe('bar', handlerBar);
    bus.publish('foo', { value: 200 });
    bus.publish('bar', { value: 300 });

    expect(handlerFoo).toHaveBeenCalledWith({ value: 200 });
    expect(handlerBar).toHaveBeenCalledWith({ value: 300 });
  });

  it('subscribing the same handler multiple times only calls it once', () => {
    const bus = createEventBus<TestEvents>();
    const handler = jest.fn();
    bus.subscribe('foo', handler);
    bus.subscribe('foo', handler); // Subscribe again
    bus.publish('foo', { value: 400 });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ value: 400 });
  });

  it('unsubscribing a handler that was never subscribed does nothing', () => {
    const bus = createEventBus<TestEvents>();
    const handler = jest.fn();
    const neverSubscribedHandler = jest.fn();

    bus.subscribe('foo', handler);
    bus.unsubscribe('foo', neverSubscribedHandler); // Unsubscribe a non-existent handler
    bus.publish('foo', { value: 500 });

    expect(handler).toHaveBeenCalledWith({ value: 500 });
    expect(neverSubscribedHandler).not.toHaveBeenCalled();
  });
});
