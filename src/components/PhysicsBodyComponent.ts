import { defineComponent } from 'bitecs';
import { RigidBody } from '@dimforge/rapier3d-compat';
import { EntityId } from '../core/types';

// BitECS component for querying entities with physics bodies
export const PhysicsBodyTag = defineComponent();

// External storage for Rapier rigid bodies
export const PhysicsBodyStorage = new Map<EntityId, RigidBody>();
