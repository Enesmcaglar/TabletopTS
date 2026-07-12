import { Scene, BoxGeometry, MeshStandardMaterial, Mesh, BufferGeometry, Material, PlaneGeometry, DoubleSide, TextureLoader, SRGBColorSpace } from 'three';
import { addEntity, addComponent } from 'bitecs';
import { GameWorld } from '../core/World';
import { TransformComponent } from '../components/TransformComponent';
import { RenderableTag, RenderableStorage } from '../components/RenderableComponent';
import { InteractableComponent } from '../components/InteractableComponent';
import { CardTag, CardSlotTag } from '../components/CardComponents';
import { EntityId } from '../core/types';

const textureLoader = new TextureLoader();
const texBack = textureLoader.load('/assets/board-policy.png');
const texFascist = textureLoader.load('/assets/board-policy-fascist.png');
const texLiberal = textureLoader.load('/assets/board-policy-liberal.png');
texBack.colorSpace = SRGBColorSpace;
texFascist.colorSpace = SRGBColorSpace;
texLiberal.colorSpace = SRGBColorSpace;

const matBack = new MeshStandardMaterial({ map: texBack, roughness: 0.2, metalness: 0.1 });
const matFascist = new MeshStandardMaterial({ map: texFascist, roughness: 0.2, metalness: 0.1 });
const matLiberal = new MeshStandardMaterial({ map: texLiberal, roughness: 0.2, metalness: 0.1 });
const matSide = new MeshStandardMaterial({ color: 0x111111, roughness: 0.8, metalness: 0 });

const matsFascist = [matSide, matSide, matBack, matFascist, matSide, matSide];
const matsLiberal = [matSide, matSide, matBack, matLiberal, matSide, matSide];

export function createClientTable(game: GameWorld, scene: Scene) {
  const eid = addEntity(game.world);
  addTransform(game, eid, { x: 1, y: 1, z: 1 });
  const mesh = createMesh(eid, scene, new BoxGeometry(2, 2, 2), new MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8, metalness: 0.1 }));
  addRenderable(game, eid, mesh);
}

export function createClientBox(game: GameWorld, scene: Scene, color: number) {
  const eid = addEntity(game.world);
  addTransform(game, eid, { x: 1, y: 1, z: 1 });
  const mesh = createMesh(eid, scene, new BoxGeometry(2, 2, 2), new MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.2 }));
  addRenderable(game, eid, mesh);
  addComponent(game.world, InteractableComponent, eid);
}

export function createClientCard(game: GameWorld, scene: Scene, type: 'fascist' | 'liberal') {
  const eid = addEntity(game.world);
  addTransform(game, eid, { x: 1, y: 1, z: 1 });
  const mats = type === 'fascist' ? matsFascist : matsLiberal;
  const mesh = createMesh(eid, scene, new BoxGeometry(2, 2, 2), mats);
  addRenderable(game, eid, mesh);
  addComponent(game.world, InteractableComponent, eid);
  addComponent(game.world, CardTag, eid);
}

export function createClientCardSlot(game: GameWorld, scene: Scene) {
  const eid = addEntity(game.world);
  addTransform(game, eid, { x: 1, y: 1, z: 1 });

  const geo = new PlaneGeometry(2, 2);
  geo.rotateX(-Math.PI / 2); // Lay flat on table
  const mat = new MeshStandardMaterial({ color: 0xffff00, transparent: true, opacity: 0.3, side: DoubleSide });
  const mesh = createMesh(eid, scene, geo, mat);

  addRenderable(game, eid, mesh);
  addComponent(game.world, CardSlotTag, eid);
}

function addTransform(game: GameWorld, eid: EntityId, scale: { x: number, y: number, z: number }) {
  addComponent(game.world, TransformComponent, eid);
  TransformComponent.scale.x[eid] = scale.x;
  TransformComponent.scale.y[eid] = scale.y;
  TransformComponent.scale.z[eid] = scale.z;
}

function createMesh(eid: EntityId, scene: Scene, geo: BufferGeometry, mat: Material | Material[]): Mesh {
  const mesh = new Mesh(geo, mat);
  mesh.userData.entityId = eid;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function addRenderable(game: GameWorld, eid: EntityId, mesh: Mesh) {
  addComponent(game.world, RenderableTag, eid);
  RenderableStorage.set(eid, mesh);
}
