import { IWorld, defineQuery, hasComponent } from 'bitecs';
import { Quaternion, Vector3 } from 'three';
import { TransformComponent } from '../../src/components/TransformComponent';
import { CardTag, CardSlotTag, CardSlotStorage, SlottedCardStorage } from '../../src/components/CardComponents';
import { EntityId } from '../../src/core/types';
import { PhysicsBodyStorage } from '../../src/components/PhysicsBodyComponent';

interface SnapTween {
  progress: number;
  duration: number;
  startPos: Vector3;
  endPos: Vector3;
  startQ: Quaternion;
  endQ: Quaternion;
}

const slotQuery = defineQuery([CardSlotTag, TransformComponent]);
const SNAP_RADIUS = 1.0;
const CARD_THICKNESS = 0.02;

export class ServerSlotSystem {
  private snapTweens = new Map<EntityId, SnapTween>();

  public update(world: IWorld, dt: number): void {
    for (const [eid, tween] of this.snapTweens.entries()) {
      tween.progress += dt / tween.duration;
      if (tween.progress >= 1) this.finishTween(eid, tween);
      else this.processTween(eid, tween);
      
      this.syncPhysics(eid);
    }
  }

  private finishTween(eid: EntityId, tween: SnapTween): void {
    this.snapTweens.delete(eid);
    this.applyTransform(eid, tween.endPos, tween.endQ);
  }

  private processTween(eid: EntityId, tween: SnapTween): void {
    const ease = 1 - Math.pow(1 - tween.progress, 3); // easeOutCubic
    const pos = tween.startPos.clone().lerp(tween.endPos, ease);
    const q = tween.startQ.clone().slerp(tween.endQ, ease);
    this.applyTransform(eid, pos, q);
  }

  private applyTransform(eid: EntityId, pos: Vector3, q: Quaternion): void {
    TransformComponent.position.x[eid] = pos.x; TransformComponent.position.y[eid] = pos.y; TransformComponent.position.z[eid] = pos.z;
    TransformComponent.rotation.x[eid] = q.x; TransformComponent.rotation.y[eid] = q.y;
    TransformComponent.rotation.z[eid] = q.z; TransformComponent.rotation.w[eid] = q.w;
  }

  private syncPhysics(eid: EntityId): void {
    const body = PhysicsBodyStorage.get(eid);
    if (!body) return;
    body.setTranslation({ x: TransformComponent.position.x[eid], y: TransformComponent.position.y[eid], z: TransformComponent.position.z[eid] }, false);
    body.setRotation({ x: TransformComponent.rotation.x[eid], y: TransformComponent.rotation.y[eid], z: TransformComponent.rotation.z[eid], w: TransformComponent.rotation.w[eid] }, false);
  }
  public handleCardDrop(world: IWorld, cardEid: EntityId): void {
    if (!hasComponent(world, CardTag, cardEid)) return;

    const slots = slotQuery(world);
    let bestSlot: EntityId | null = null;
    let bestDist = SNAP_RADIUS;

    for (const slotEid of slots) {
      const dist = this.getDistance(cardEid, slotEid);
      if (dist < bestDist) {
        bestDist = dist;
        bestSlot = slotEid;
      }
    }

    if (bestSlot !== null) {
      this.slotCard(cardEid, bestSlot);
    }
  }

  public handleCardGrab(world: IWorld, cardEid: EntityId): void {
    if (SlottedCardStorage.has(cardEid)) {
      this.unslotCard(cardEid);
    }
  }

  public shuffleSlot(targetEid: EntityId): void {
    let slotEid = targetEid;
    if (SlottedCardStorage.has(targetEid)) {
      slotEid = SlottedCardStorage.get(targetEid)!;
    }

    const stack = CardSlotStorage.get(slotEid);
    if (!stack || stack.length < 2) return;
    
    // Fisher-Yates shuffle
    for (let i = stack.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [stack[i], stack[j]] = [stack[j], stack[i]];
    }
    
    this.updateStackPositions(slotEid);
  }

  private slotCard(cardEid: EntityId, slotEid: EntityId): void {
    const stack = CardSlotStorage.get(slotEid)!;
    stack.push(cardEid);
    SlottedCardStorage.set(cardEid, slotEid);
    this.updateStackPositions(slotEid);
  }

  private unslotCard(cardEid: EntityId): void {
    const slotEid = SlottedCardStorage.get(cardEid)!;
    SlottedCardStorage.delete(cardEid);
    
    const stack = CardSlotStorage.get(slotEid)!;
    const idx = stack.indexOf(cardEid);
    if (idx > -1) stack.splice(idx, 1);
    
    this.updateStackPositions(slotEid);
  }

  private updateStackPositions(slotEid: EntityId): void {
    const stack = CardSlotStorage.get(slotEid)!;
    const basePos = new Vector3(
      TransformComponent.position.x[slotEid],
      TransformComponent.position.y[slotEid],
      TransformComponent.position.z[slotEid]
    );

    for (let i = 0; i < stack.length; i++) {
      this.queueCardSnap(stack[i], i, basePos);
    }
  }

  private queueCardSnap(cardEid: EntityId, index: number, basePos: Vector3): void {
    const rx = TransformComponent.rotation.x[cardEid];
    const rz = TransformComponent.rotation.z[cardEid];
    const isUpsideDown = (1 - 2 * (rx * rx + rz * rz)) < 0;
    
    const endQ = new Quaternion(0, 0, isUpsideDown ? 1 : 0, isUpsideDown ? 0 : 1);
    const startQ = new Quaternion(TransformComponent.rotation.x[cardEid], TransformComponent.rotation.y[cardEid], TransformComponent.rotation.z[cardEid], TransformComponent.rotation.w[cardEid]);
    const startPos = new Vector3(TransformComponent.position.x[cardEid], TransformComponent.position.y[cardEid], TransformComponent.position.z[cardEid]);
    const endPos = new Vector3(basePos.x, basePos.y + (index * CARD_THICKNESS), basePos.z);
    
    this.snapTweens.set(cardEid, { progress: 0, duration: 0.2, startPos, endPos, startQ, endQ });
  }

  private getDistance(eidA: EntityId, eidB: EntityId): number {
    const dx = TransformComponent.position.x[eidA] - TransformComponent.position.x[eidB];
    const dz = TransformComponent.position.z[eidA] - TransformComponent.position.z[eidB];
    return Math.sqrt(dx * dx + dz * dz); // 2D distance ignoring Y height
  }
}
