import { IWorld, defineQuery, hasComponent } from 'bitecs';
import { TransformComponent } from '../../src/components/TransformComponent';
import { CardTag, CardSlotTag, CardSlotStorage, SlottedCardStorage } from '../../src/components/CardComponents';
import { EntityId } from '../../src/core/types';

const slotQuery = defineQuery([CardSlotTag, TransformComponent]);
const SNAP_RADIUS = 1.0;
const CARD_THICKNESS = 0.02;

export class ServerSlotSystem {
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
    const baseX = TransformComponent.position.x[slotEid];
    const baseY = TransformComponent.position.y[slotEid];
    const baseZ = TransformComponent.position.z[slotEid];

    for (let i = 0; i < stack.length; i++) {
      const cardEid = stack[i];
      TransformComponent.position.x[cardEid] = baseX;
      TransformComponent.position.y[cardEid] = baseY + (i * CARD_THICKNESS);
      TransformComponent.position.z[cardEid] = baseZ;
      
      const rx = TransformComponent.rotation.x[cardEid];
      const rz = TransformComponent.rotation.z[cardEid];
      const isUpsideDown = (1 - 2 * (rx * rx + rz * rz)) < 0;
      
      TransformComponent.rotation.x[cardEid] = 0;
      TransformComponent.rotation.y[cardEid] = 0;
      TransformComponent.rotation.z[cardEid] = isUpsideDown ? 1 : 0;
      TransformComponent.rotation.w[cardEid] = isUpsideDown ? 0 : 1;
    }
  }

  private getDistance(eidA: EntityId, eidB: EntityId): number {
    const dx = TransformComponent.position.x[eidA] - TransformComponent.position.x[eidB];
    const dz = TransformComponent.position.z[eidA] - TransformComponent.position.z[eidB];
    return Math.sqrt(dx * dx + dz * dz); // 2D distance ignoring Y height
  }
}
