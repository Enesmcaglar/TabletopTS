import { WebSocketServer, WebSocket } from 'ws';
import RAPIER from '@dimforge/rapier3d-compat';
import { defineQuery } from 'bitecs';
import { GameWorld } from '../src/core/World';
import { ServerPhysicsSystem } from './systems/ServerPhysicsSystem';
import { createServerTable, createServerBox, createServerCard } from './prefabs/ServerEntityFactory';
import { TransformComponent } from '../src/components/TransformComponent';
import { InteractableComponent } from '../src/components/InteractableComponent';
import { MessageType, NetworkMessage, StateUpdatePayload, ClientActionPayload } from '../src/core/NetworkProtocol';

const transformQuery = defineQuery([TransformComponent]);

async function initServer() {
  await RAPIER.init();
  const wss = new WebSocketServer({ port: 8080 });
  const physicsWorld = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
  const gameWorld = new GameWorld();
  
  setupServerSystems(gameWorld, physicsWorld);
  spawnServerEntities(gameWorld, physicsWorld);
  setupWebSockets(wss, gameWorld);
  
  startGameLoop(gameWorld, wss);
}

function setupServerSystems(world: GameWorld, physics: RAPIER.World) {
  const physicsSys = new ServerPhysicsSystem(physics);
  world.addSystem(physicsSys.update.bind(physicsSys));
}

function spawnServerEntities(world: GameWorld, physics: RAPIER.World) {
  createServerTable(world, physics, { x: 0, y: 0, z: 0 });
  createServerBox(world, physics, { x: -2, y: 3, z: 0 });
  createServerBox(world, physics, { x: 2, y: 5, z: 0 });
  createServerCard(world, physics, { x: 0, y: 2, z: 1 });
}

function setupWebSockets(wss: WebSocketServer, world: GameWorld) {
  wss.on('connection', (ws) => {
    sendFullState(ws, world);
    ws.on('message', (data) => handleClientMessage(data, world));
  });
}

function sendFullState(ws: WebSocket, world: GameWorld) {
  const payload = buildStatePayload(world);
  ws.send(JSON.stringify({ type: MessageType.INIT_STATE, payload }));
}

function handleClientMessage(data: import('ws').RawData, world: GameWorld) {
  const msg = JSON.parse(data.toString()) as NetworkMessage;
  const payload = msg.payload as ClientActionPayload;
  
  if (msg.type === MessageType.CLIENT_GRAB) {
    InteractableComponent.isDragged[payload.eid] = 1;
  } else if (msg.type === MessageType.CLIENT_RELEASE) {
    InteractableComponent.isDragged[payload.eid] = 0;
  } else if (msg.type === MessageType.CLIENT_MOVE && payload.pos) {
    TransformComponent.position.x[payload.eid] = payload.pos.x;
    TransformComponent.position.y[payload.eid] = payload.pos.y;
    TransformComponent.position.z[payload.eid] = payload.pos.z;
  }
}

function startGameLoop(world: GameWorld, wss: WebSocketServer) {
  let lastTime = Date.now();
  setInterval(() => {
    const now = Date.now();
    world.update((now - lastTime) / 1000);
    lastTime = now;
    broadcastState(wss, world);
  }, 1000 / 144); // 60 ticks per second
}

function broadcastState(wss: WebSocketServer, world: GameWorld) {
  const payload = buildStatePayload(world);
  const msg = JSON.stringify({ type: MessageType.STATE_UPDATE, payload });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

function buildStatePayload(world: GameWorld): StateUpdatePayload {
  const entities = transformQuery(world.world);
  const transforms = [];
  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    transforms.push({
      eid,
      pos: { x: TransformComponent.position.x[eid], y: TransformComponent.position.y[eid], z: TransformComponent.position.z[eid] },
      rot: { x: TransformComponent.rotation.x[eid], y: TransformComponent.rotation.y[eid], z: TransformComponent.rotation.z[eid], w: TransformComponent.rotation.w[eid] },
      scl: { x: TransformComponent.scale.x[eid], y: TransformComponent.scale.y[eid], z: TransformComponent.scale.z[eid] }
    });
  }
  return { transforms };
}

initServer();
