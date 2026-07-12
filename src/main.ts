import { WebGLRenderer, Scene, PerspectiveCamera, DirectionalLight, AmbientLight } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GameWorld } from './core/World';
import { NetworkClient } from './core/NetworkClient';
import { RenderSystem } from './systems/RenderSystem';
import { NetworkSyncSystem } from './systems/NetworkSyncSystem';
import { InputInteractionSystem } from './systems/InputSystem';
import { createClientTable, createClientBox, createClientCard } from './prefabs/EntityFactory';

async function init() {
  const canvas = setupCanvas();
  const renderer = setupRenderer(canvas);
  const scene = new Scene();
  const camera = setupCamera();
  const controls = setupControls(camera, renderer);
  setupLighting(scene);

  const gameWorld = new GameWorld();
  const networkClient = new NetworkClient(gameWorld.eventBus);

  setupSystems(gameWorld, renderer, scene, camera, networkClient, canvas);
  spawnEntities(gameWorld, scene);
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

function setupSystems(world: GameWorld, renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera, netClient: NetworkClient, canvas: HTMLCanvasElement): void {
  const renderSys = new RenderSystem(renderer, scene, camera);
  const syncSys = new NetworkSyncSystem(netClient);
  const inputSys = new InputInteractionSystem(camera, world.eventBus, canvas, netClient);

  world.addSystem(syncSys.update.bind(syncSys));
  world.addSystem(inputSys.update.bind(inputSys));
  world.addSystem(renderSys.update.bind(renderSys));
}

function spawnEntities(world: GameWorld, scene: Scene): void {
  // We MUST spawn entities in the exact same order as the server so their EIDs match perfectly.
  createClientTable(world, scene);
  for (let i = 0; i < 17; i++) {
    createClientCard(world, scene);
  }
  createClientBox(world, scene, 0xff0000);
  createClientBox(world, scene, 0x0000ff);
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
