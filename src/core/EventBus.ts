import { EntityId } from './types';

export enum EventType {
  ENTITY_SELECTED = 'ENTITY_SELECTED',
  ENTITY_DESELECTED = 'ENTITY_DESELECTED',
  ENTITY_DRAGGED = 'ENTITY_DRAGGED',
  ENTITY_RELEASED = 'ENTITY_RELEASED',
  PHYSICS_COLLISION = 'PHYSICS_COLLISION'
}

type EventHandler<T = unknown> = (data: T) => void;

export class EventBus {
  private listeners: Map<EventType, EventHandler[]> = new Map();

  public subscribe<T>(type: EventType, handler: EventHandler<T>): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(handler as EventHandler);
  }

  public unsubscribe<T>(type: EventType, handler: EventHandler<T>): void {
    const handlers = this.listeners.get(type);
    if (!handlers) return;
    const index = handlers.indexOf(handler as EventHandler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  public publish<T>(type: EventType, data: T): void {
    const handlers = this.listeners.get(type);
    if (!handlers) return;
    for (const handler of handlers) {
      handler(data);
    }
  }
}
