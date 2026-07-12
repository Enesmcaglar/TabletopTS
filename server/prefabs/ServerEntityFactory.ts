import RAPIER from '@dimforge/rapier3d-compat';
import { addEntity, addComponent } from 'bitecs';
import { GameWorld } from '../../src/core/World';
import { TransformComponent } from '../../src/components/TransformComponent';
import { PhysicsBodyTag, PhysicsBodyStorage } from '../../src/components/PhysicsBodyComponent';
import { InteractableComponent } from '../../src/components/InteractableComponent';
import { CardTag, CardSlotTag, CardSlotStorage } from '../../src/components/CardComponents';
import { Position, EntityId } from '../../src/core/types';

export function createServerTable(game: GameWorld, phys: RAPIER.World, pos: Position) {
  const eid = addEntity(game.world);
  addTransform(game, eid, { x: 14, y: 0.25, z: 14 });
  const colDesc = RAPIER.ColliderDesc.cuboid(14, 0.25, 14);
  addFixedBody(game, phys, eid, pos, colDesc);
}

export function createServerTray(game: GameWorld, phys: RAPIER.World, pos: Position, type: 'liberal' | 'fascist') {
  const eid = addEntity(game.world);
  let height = type === "liberal" ? 2 : 2.1;
  addTransform(game, eid, { x: 2.59 * height, y: 0.025, z: height });
  const colDesc = RAPIER.ColliderDesc.cuboid(2.59 * height, 0.025, height);
  addFixedBody(game, phys, eid, pos, colDesc);
}

export function createServerBox(game: GameWorld, phys: RAPIER.World, pos: Position) {
  const eid = addEntity(game.world);
  addTransform(game, eid, { x: 0.5, y: 0.5, z: 0.5 });
  const colDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
  addDynamicBody(game, phys, eid, pos, colDesc);
  addComponent(game.world, InteractableComponent, eid);
}

export function createServerCard(game: GameWorld, phys: RAPIER.World, pos: Position) {
  const eid = addEntity(game.world);
  addTransform(game, eid, { x: 0.63, y: 0.03, z: 0.88 });
  const colDesc = RAPIER.ColliderDesc.cuboid(0.63, 0.03, 0.88);
  addDynamicBody(game, phys, eid, pos, colDesc);
  addComponent(game.world, InteractableComponent, eid);
  addComponent(game.world, CardTag, eid);
}

export function createServerCardSlot(game: GameWorld, phys: RAPIER.World, pos: Position) {
  const eid = addEntity(game.world);
  addTransform(game, eid, { x: 0.63, y: 0.01, z: 0.88 });
  TransformComponent.position.x[eid] = pos.x;
  TransformComponent.position.y[eid] = pos.y;
  TransformComponent.position.z[eid] = pos.z;
  addComponent(game.world, CardSlotTag, eid);
  CardSlotStorage.set(eid, []);
}

function addTransform(game: GameWorld, eid: EntityId, scale: { x: number, y: number, z: number }) {
  addComponent(game.world, TransformComponent, eid);
  TransformComponent.scale.x[eid] = scale.x;
  TransformComponent.scale.y[eid] = scale.y;
  TransformComponent.scale.z[eid] = scale.z;
}

function addFixedBody(game: GameWorld, phys: RAPIER.World, eid: EntityId, pos: Position, colDesc: RAPIER.ColliderDesc) {
  addComponent(game.world, PhysicsBodyTag, eid);
  const rbDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(pos.x, pos.y, pos.z);
  const body = phys.createRigidBody(rbDesc);
  phys.createCollider(colDesc, body);
  PhysicsBodyStorage.set(eid, body);
}

function addDynamicBody(game: GameWorld, phys: RAPIER.World, eid: EntityId, pos: Position, colDesc: RAPIER.ColliderDesc) {
  addComponent(game.world, PhysicsBodyTag, eid);
  const rbDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(pos.x, pos.y, pos.z);
  const body = phys.createRigidBody(rbDesc);
  phys.createCollider(colDesc, body);
  PhysicsBodyStorage.set(eid, body);
}
