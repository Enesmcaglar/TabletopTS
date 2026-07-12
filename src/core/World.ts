import { createWorld, IWorld } from 'bitecs';
import { EventBus } from './EventBus';

export class GameWorld {
  public world: IWorld;
  public eventBus: EventBus;
  private systems: ((world: IWorld, dt: number) => void)[] = [];

  constructor() {
    this.world = createWorld();
    this.eventBus = new EventBus();
  }

  public addSystem(system: (world: IWorld, dt: number) => void): void {
    this.systems.push(system);
  }

  public update(deltaTime: number): void {
    for (const system of this.systems) {
      system(this.world, deltaTime);
    }
  }
}
