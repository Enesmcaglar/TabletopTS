import { IWorld, defineQuery } from 'bitecs';
import { WebGLRenderer, Scene, PerspectiveCamera } from 'three';
import { TransformComponent } from '../components/TransformComponent';
import { RenderableTag, RenderableStorage } from '../components/RenderableComponent';

const renderQuery = defineQuery([TransformComponent, RenderableTag]);

export class RenderSystem {
  constructor(
    private renderer: WebGLRenderer,
    private scene: Scene,
    private camera: PerspectiveCamera
  ) {}

  public update(world: IWorld, _dt: number): void {
    const entities = renderQuery(world);
    for (const eid of entities) {
      const obj = RenderableStorage.get(eid);
      if (!obj) continue;

      obj.position.set(
        TransformComponent.position.x[eid],
        TransformComponent.position.y[eid],
        TransformComponent.position.z[eid]
      );
      obj.quaternion.set(
        TransformComponent.rotation.x[eid],
        TransformComponent.rotation.y[eid],
        TransformComponent.rotation.z[eid],
        TransformComponent.rotation.w[eid]
      );
      obj.scale.set(
        TransformComponent.scale.x[eid],
        TransformComponent.scale.y[eid],
        TransformComponent.scale.z[eid]
      );
    }
    this.renderer.render(this.scene, this.camera);
  }
}
