import { IWorld, defineQuery, hasComponent } from 'bitecs';
import { World as PhysicsWorld, RigidBody } from '@dimforge/rapier3d-compat';
import { TransformComponent } from '../../src/components/TransformComponent';
import { PhysicsBodyTag, PhysicsBodyStorage } from '../../src/components/PhysicsBodyComponent';
import { InteractableComponent } from '../../src/components/InteractableComponent';
import { SlottedCardStorage } from '../../src/components/CardComponents';
import { EntityId } from '../../src/core/types';

const physicsQuery = defineQuery([TransformComponent, PhysicsBodyTag]);

export class ServerPhysicsSystem {
  constructor(private physicsWorld: PhysicsWorld) {}

  public update(world: IWorld, _dt: number): void {
    const entities = physicsQuery(world);
    this.preStepDragLogic(world, entities);
    this.physicsWorld.step();
    this.postStepSync(world, entities);
  }

  private preStepDragLogic(world: IWorld, entities: readonly number[]): void {
    for (const eid of entities) {
      const body = PhysicsBodyStorage.get(eid);
      if (!body || !hasComponent(world, InteractableComponent, eid)) continue;

      if (InteractableComponent.isDragged[eid] === 1) {
        this.disablePhysics(body);
        this.syncTransformToBody(eid, body);
      } else if (!body.isEnabled()) {
        if (!SlottedCardStorage.has(eid)) {
          this.enablePhysics(body);
        } else {
          this.syncTransformToBody(eid, body); // Keep kinematic sync for stacked cards
        }
      }
    }
  }

  private postStepSync(world: IWorld, entities: readonly number[]): void {
    for (const eid of entities) {
      if (hasComponent(world, InteractableComponent, eid) && InteractableComponent.isDragged[eid] === 1) {
        continue;
      }
      const body = PhysicsBodyStorage.get(eid);
      if (body) this.syncBodyToTransform(eid, body);
    }
  }

  private disablePhysics(body: RigidBody): void {
    if (body.isEnabled()) body.setEnabled(false);
  }

  private enablePhysics(body: RigidBody): void {
    body.setEnabled(true);
    body.wakeUp();
  }

  private syncTransformToBody(eid: EntityId, body: RigidBody): void {
    body.setTranslation({
      x: TransformComponent.position.x[eid],
      y: TransformComponent.position.y[eid],
      z: TransformComponent.position.z[eid]
    }, false);
    body.setRotation({
      x: TransformComponent.rotation.x[eid],
      y: TransformComponent.rotation.y[eid],
      z: TransformComponent.rotation.z[eid],
      w: TransformComponent.rotation.w[eid]
    }, false);
  }

  private syncBodyToTransform(eid: EntityId, body: RigidBody): void {
    const pos = body.translation();
    const rot = body.rotation();
    TransformComponent.position.x[eid] = pos.x;
    TransformComponent.position.y[eid] = pos.y;
    TransformComponent.position.z[eid] = pos.z;
    TransformComponent.rotation.x[eid] = rot.x;
    TransformComponent.rotation.y[eid] = rot.y;
    TransformComponent.rotation.z[eid] = rot.z;
    TransformComponent.rotation.w[eid] = rot.w;
  }
}
