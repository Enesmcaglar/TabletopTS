import { Scene, BoxGeometry, MeshStandardMaterial, Mesh, BufferGeometry, Material } from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { addEntity, addComponent } from 'bitecs';
import { GameWorld } from '../core/World';
import { TransformComponent } from '../components/TransformComponent';
import { RenderableTag, RenderableStorage } from '../components/RenderableComponent';
import { PhysicsBodyTag, PhysicsBodyStorage } from '../components/PhysicsBodyComponent';
import { InteractableComponent } from '../components/InteractableComponent';
import { Position, EntityId } from '../core/types';

export function createTable(game: GameWorld, scene: Scene, phys: RAPIER.World, pos: Position) {
  const eid = addEntity(game.world);
  addTransform(game, eid, { x: 10, y: 0.5, z: 10 });
  
  const mesh = createMesh(eid, scene, new BoxGeometry(2, 0.5, 2), new MeshStandardMaterial({ color: 0x5c4033 }));
  addRenderable(game, eid, mesh);
  
  const colDesc = RAPIER.ColliderDesc.cuboid(10.0, 0.25, 10.0);
  addFixedBody(game, phys, eid, pos, colDesc);
}

export function createBox(game: GameWorld, scene: Scene, phys: RAPIER.World, pos: Position, color: number) {
  const eid = addEntity(game.world);
  addTransform(game, eid, { x: 1, y: 1, z: 1 });
  
  const mesh = createMesh(eid, scene, new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ color }));
  addRenderable(game, eid, mesh);
  
  const colDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
  addDynamicBody(game, phys, eid, pos, colDesc);
  addComponent(game.world, InteractableComponent, eid);
}

export function createCard(game: GameWorld, scene: Scene, phys: RAPIER.World, pos: Position) {
  const eid = addEntity(game.world);
  addTransform(game, eid, { x: 1, y: 1, z: 1 });
  
  const mesh = createMesh(eid, scene, new BoxGeometry(1.26, 0.02, 1.76), new MeshStandardMaterial({ color: 0xffffff }));
  addRenderable(game, eid, mesh);
  
  const colDesc = RAPIER.ColliderDesc.cuboid(0.63, 0.01, 0.88);
  addDynamicBody(game, phys, eid, pos, colDesc);
  addComponent(game.world, InteractableComponent, eid);
}

function addTransform(game: GameWorld, eid: EntityId, scale: {x: number, y: number, z: number}) {
  addComponent(game.world, TransformComponent, eid);
  TransformComponent.scale.x[eid] = scale.x;
  TransformComponent.scale.y[eid] = scale.y;
  TransformComponent.scale.z[eid] = scale.z;
}

function createMesh(eid: EntityId, scene: Scene, geo: BufferGeometry, mat: Material): Mesh {
  const mesh = new Mesh(geo, mat);
  mesh.userData.entityId = eid;
  scene.add(mesh);
  return mesh;
}

function addRenderable(game: GameWorld, eid: EntityId, mesh: Mesh) {
  addComponent(game.world, RenderableTag, eid);
  RenderableStorage.set(eid, mesh);
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
