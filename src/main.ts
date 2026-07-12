import { WebGLRenderer, Scene, PerspectiveCamera, DirectionalLight, AmbientLight } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import RAPIER from '@dimforge/rapier3d-compat';
import { GameWorld } from './core/World';
import { RenderSystem } from './systems/RenderSystem';
import { PhysicsSystem } from './systems/PhysicsSystem';
import { InputInteractionSystem } from './systems/InputSystem';
import { createTable, createBox, createCard } from './prefabs/EntityFactory';

async function init() {
  await RAPIER.init();
  const canvas = setupCanvas();
  const renderer = setupRenderer(canvas);
  const scene = new Scene();
  const camera = setupCamera();
  const controls = setupControls(camera, renderer);
  setupLighting(scene);

  const physicsWorld = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
  const gameWorld = new GameWorld();

  setupSystems(gameWorld, renderer, scene, camera, physicsWorld, canvas);
  spawnEntities(gameWorld, scene, physicsWorld);
  startGameLoop(gameWorld, controls);
}

function setupCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  document.getElementById('app')!.appendChild(canvas);
  return canvas;
}

function setupRenderer(canvas: HTMLCanvasElement): WebGLRenderer {
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  return renderer;
}

function setupCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 8, 12);
  camera.lookAt(0, 0, 0);
  return camera;
}

function setupControls(camera: PerspectiveCamera, renderer: WebGLRenderer): OrbitControls {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.mouseButtons = {
    LEFT: null as unknown as any,
    MIDDLE: 2, // MOUSE.PAN
    RIGHT: 0   // MOUSE.ROTATE
  };
  return controls;
}

function setupLighting(scene: Scene): void {
  scene.add(new AmbientLight(0xffffff, 0.6));
  const dirLight = new DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(10, 20, 10);
  scene.add(dirLight);
}

function setupSystems(world: GameWorld, renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera, physics: RAPIER.World, canvas: HTMLCanvasElement): void {
  const renderSys = new RenderSystem(renderer, scene, camera);
  const physicsSys = new PhysicsSystem(physics);
  const inputSys = new InputInteractionSystem(camera, world.eventBus, canvas);

  world.addSystem(physicsSys.update.bind(physicsSys));
  world.addSystem(inputSys.update.bind(inputSys));
  world.addSystem(renderSys.update.bind(renderSys));
}

function spawnEntities(world: GameWorld, scene: Scene, physics: RAPIER.World): void {
  createTable(world, scene, physics, { x: 0, y: 0, z: 0 });
  createBox(world, scene, physics, { x: -2, y: 3, z: 0 }, 0xff0000);
  createBox(world, scene, physics, { x: 2, y: 5, z: 0 }, 0x0000ff);
  createCard(world, scene, physics, { x: 0, y: 2, z: 1 });
}

function startGameLoop(world: GameWorld, controls: OrbitControls): void {
  let lastTime = performance.now();
  function animate(time: number) {
    requestAnimationFrame(animate);
    const dt = (time - lastTime) / 1000;
    lastTime = time;
    controls.update();
    world.update(dt);
  }
  requestAnimationFrame(animate);
}

init();
