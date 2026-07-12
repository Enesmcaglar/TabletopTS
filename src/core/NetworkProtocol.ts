import { EntityId, Position, Rotation } from './types';

export enum MessageType {
  INIT_STATE = 'INIT_STATE',
  STATE_UPDATE = 'STATE_UPDATE',
  CLIENT_GRAB = 'CLIENT_GRAB',
  CLIENT_MOVE = 'CLIENT_MOVE',
  CLIENT_RELEASE = 'CLIENT_RELEASE'
}

export interface TransformState {
  eid: EntityId;
  pos: Position;
  rot: Rotation;
  scl: { x: number, y: number, z: number };
}

export interface StateUpdatePayload {
  transforms: TransformState[];
}

export interface ClientActionPayload {
  eid: EntityId;
  pos?: Position;
}

export interface NetworkMessage {
  type: MessageType;
  payload: StateUpdatePayload | ClientActionPayload;
}
