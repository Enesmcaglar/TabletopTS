import { IWorld, defineQuery, hasComponent } from 'bitecs';
import { World as PhysicsWorld, RigidBody } from '@dimforge/rapier3d-compat';
import { Quaternion } from 'three';
import { TransformComponent } from '../../src/components/TransformComponent';
import { PhysicsBodyTag, PhysicsBodyStorage } from '../../src/components/PhysicsBodyComponent';
import { InteractableComponent } from '../../src/components/InteractableComponent';
import { SlottedCardStorage } from '../../src/components/CardComponents';
import { EntityId } from '../../src/core/types';

interface FlipTween {
  progress: number;
  duration: number;
  startQ: Quaternion;
  endQ: Quaternion;
  baseY: number;
}

const physicsQuery = defineQuery([TransformComponent, PhysicsBodyTag]);

export class ServerPhysicsSystem {
  private flipTweens = new Map<EntityId, FlipTween>();
  
  constructor(private physicsWorld: PhysicsWorld) {}

  public update(world: IWorld, dt: number): void {
    const entities = physicsQuery(world);
    this.processAnimations(dt);
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

  public flipCard(eid: EntityId): void {
    if (this.flipTweens.has(eid)) return;
    
    const body = PhysicsBodyStorage.get(eid);
    if (body) this.disablePhysics(body);
    
    const x = TransformComponent.rotation.x[eid], y = TransformComponent.rotation.y[eid];
    const z = TransformComponent.rotation.z[eid], w = TransformComponent.rotation.w[eid];
    const startQ = new Quaternion(x, y, z, w);
    const endQ = startQ.clone().multiply(new Quaternion(0, 0, 1, 0));
    
    this.flipTweens.set(eid, { progress: 0, duration: 0.25, startQ, endQ, baseY: TransformComponent.position.y[eid] });
  }

  private processAnimations(dt: number): void {
    for (const [eid, tween] of this.flipTweens.entries()) {
      tween.progress += dt / tween.duration;
      if (tween.progress >= 1) {
        this.finishAnimation(eid, tween);
      } else {
        this.updateTweenState(eid, tween);
      }
    }
  }

  private updateTweenState(eid: EntityId, tween: FlipTween): void {
    const q = tween.startQ.clone().slerp(tween.endQ, tween.progress);
    TransformComponent.rotation.x[eid] = q.x; TransformComponent.rotation.y[eid] = q.y;
    TransformComponent.rotation.z[eid] = q.z; TransformComponent.rotation.w[eid] = q.w;
    
    const lift = Math.sin(tween.progress * Math.PI) * 1.5;
    TransformComponent.position.y[eid] = tween.baseY + lift;
    
    const body = PhysicsBodyStorage.get(eid);
    if (body) this.syncTransformToBody(eid, body);
  }

  private finishAnimation(eid: EntityId, tween: FlipTween): void {
    this.flipTweens.delete(eid);
    TransformComponent.rotation.x[eid] = tween.endQ.x; TransformComponent.rotation.y[eid] = tween.endQ.y;
    TransformComponent.rotation.z[eid] = tween.endQ.z; TransformComponent.rotation.w[eid] = tween.endQ.w;
    TransformComponent.position.y[eid] = tween.baseY;
    
    const body = PhysicsBodyStorage.get(eid);
    if (body && !SlottedCardStorage.has(eid)) this.enablePhysics(body);
    if (body) this.syncTransformToBody(eid, body);
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
