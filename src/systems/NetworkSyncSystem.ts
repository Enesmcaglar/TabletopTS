import { IWorld, defineQuery } from 'bitecs';
import { TransformComponent } from '../components/TransformComponent';
import { InteractableComponent } from '../components/InteractableComponent';
import { NetworkClient } from '../core/NetworkClient';

const transformQuery = defineQuery([TransformComponent]);

export class NetworkSyncSystem {
  constructor(private networkClient: NetworkClient) {}

  public update(world: IWorld, _dt: number): void {
    if (!this.networkClient.latestState) return;

    const state = this.networkClient.latestState.transforms;
    for (const transform of state) {
      const eid = transform.eid;
      
      // Do not sync transform from server if we are actively dragging it
      if (InteractableComponent.isDragged[eid] === 1) continue;

      TransformComponent.position.x[eid] = transform.pos.x;
      TransformComponent.position.y[eid] = transform.pos.y;
      TransformComponent.position.z[eid] = transform.pos.z;

      TransformComponent.rotation.x[eid] = transform.rot.x;
      TransformComponent.rotation.y[eid] = transform.rot.y;
      TransformComponent.rotation.z[eid] = transform.rot.z;
      TransformComponent.rotation.w[eid] = transform.rot.w;

      TransformComponent.scale.x[eid] = transform.scl.x;
      TransformComponent.scale.y[eid] = transform.scl.y;
      TransformComponent.scale.z[eid] = transform.scl.z;
    }
  }
}
