import { Object3D } from 'three';
import { defineComponent } from 'bitecs';
import { EntityId } from '../core/types';

// BitECS component for querying
export const RenderableTag = defineComponent();

// External storage for Three.js objects since BitECS only supports numbers
export const RenderableStorage = new Map<EntityId, Object3D>();
