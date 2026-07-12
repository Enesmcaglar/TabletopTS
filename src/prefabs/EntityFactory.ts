import { Scene, BoxGeometry, MeshStandardMaterial, Mesh, BufferGeometry, Material } from 'three';
import { addEntity, addComponent } from 'bitecs';
import { GameWorld } from '../core/World';
import { TransformComponent } from '../components/TransformComponent';
import { RenderableTag, RenderableStorage } from '../components/RenderableComponent';
import { InteractableComponent } from '../components/InteractableComponent';
import { EntityId } from '../core/types';

export function createClientTable(game: GameWorld, scene: Scene) {
  const eid = addEntity(game.world);
  addTransform(game, eid, { x: 10, y: 0.5, z: 6 });
  const mesh = createMesh(eid, scene, new BoxGeometry(10, 0.5, 6), new MeshStandardMaterial({ color: 0x5c4033 }));
  addRenderable(game, eid, mesh);
}

export function createClientBox(game: GameWorld, scene: Scene, color: number) {
  const eid = addEntity(game.world);
  addTransform(game, eid, { x: 1, y: 1, z: 1 });
  const mesh = createMesh(eid, scene, new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ color }));
  addRenderable(game, eid, mesh);
  addComponent(game.world, InteractableComponent, eid);
}

export function createClientCard(game: GameWorld, scene: Scene) {
  const eid = addEntity(game.world);
  addTransform(game, eid, { x: 1, y: 1, z: 1 });
  const mesh = createMesh(eid, scene, new BoxGeometry(1.26, 0.02, 1.76), new MeshStandardMaterial({ color: 0xffffff }));
  addRenderable(game, eid, mesh);
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
