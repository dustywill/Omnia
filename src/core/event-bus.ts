export type EventBus<Events extends Record<string, unknown>> = {
  subscribe<E extends keyof Events>(
    event: E,
    handler: (payload: Events[E]) => void,
  ): void;
  unsubscribe<E extends keyof Events>(
    event: E,
    handler: (payload: Events[E]) => void,
  ): void;
  publish<E extends keyof Events>(event: E, payload: Events[E]): void;
};

export const createEventBus = <Events extends Record<string, unknown>>(): EventBus<Events> => {
  const handlers: { [K in keyof Events]?: Array<(payload: Events[K]) => void> } = {};

  return {
    subscribe(event, handler) {
      const list = handlers[event] ?? [];
      handlers[event] = [...list, handler];
    },
    unsubscribe(event, handler) {
      const list = handlers[event];
      if (!list) return;
      handlers[event] = list.filter((h) => h !== handler);
    },
    publish(event, payload) {
      const list = handlers[event];
      if (!list) return;
      for (const handler of list) {
        handler(payload);
      }
    },
  };
};
