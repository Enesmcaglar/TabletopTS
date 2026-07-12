import { WebGLRenderer, Scene, PerspectiveCamera, DirectionalLight, HemisphereLight, Color, PCFSoftShadowMap, ACESFilmicToneMapping, PMREMGenerator } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GameWorld } from './core/World';
import { NetworkClient } from './core/NetworkClient';
import { RenderSystem } from './systems/RenderSystem';
import { NetworkSyncSystem } from './systems/NetworkSyncSystem';
import { InputInteractionSystem } from './systems/InputSystem';
import { createClientTable, createClientBox, createClientCard, createClientCardSlot, createClientTray } from './prefabs/EntityFactory';

async function init() {
  const canvas = setupCanvas();
  const renderer = setupRenderer(canvas);
  const scene = new Scene();
  scene.background = new Color(0x87ceeb); // Basic sky blue
  const camera = setupCamera();
  const controls = setupControls(camera, renderer);
  
  const pmremGenerator = new PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  
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
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
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
  const hemiLight = new HemisphereLight(0xffffff, 0x444444, 0.6);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  const dirLight = new DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(10, 20, 10);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 50;
  dirLight.shadow.camera.left = -10;
  dirLight.shadow.camera.right = 10;
  dirLight.shadow.camera.top = 10;
  dirLight.shadow.camera.bottom = -10;
  dirLight.shadow.bias = -0.0001;
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
  createClientTray(world, scene, 'liberal');
  for (let i = 0; i < 5; i++) {
    createClientCardSlot(world, scene, false);
  }

  createClientTray(world, scene, 'fascist');
  for (let i = 0; i < 6; i++) {
    createClientCardSlot(world, scene, false);
  }

  createClientBox(world, scene, 0xff0000);
  createClientBox(world, scene, 0x0000ff);
  
  // Spawn 11 Fascist and 6 Liberal cards in deterministic order to match server EIDs
  for (let i = 0; i < 11; i++) {
    createClientCard(world, scene, 'fascist');
  }
  for (let i = 0; i < 6; i++) {
    createClientCard(world, scene, 'liberal');
  }
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
