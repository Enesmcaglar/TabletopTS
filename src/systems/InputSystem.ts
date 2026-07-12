import { IWorld, hasComponent } from 'bitecs';
import { Raycaster, Vector2, PerspectiveCamera, Plane, Vector3, Intersection } from 'three';
import { EventBus, EventType } from '../core/EventBus';
import { RenderableStorage } from '../components/RenderableComponent';
import { InteractableComponent } from '../components/InteractableComponent';
import { TransformComponent } from '../components/TransformComponent';
import { CardTag, CardSlotTag } from '../components/CardComponents';
import { NetworkClient } from '../core/NetworkClient';
import { MessageType } from '../core/NetworkProtocol';

export class InputInteractionSystem {
  private raycaster = new Raycaster();
  private mouse = new Vector2();
  
  private isMouseDown = false;
  private justPressed = false;
  private justReleased = false;

  private draggedEntity: number | null = null;
  private dragPlane = new Plane(new Vector3(0, 1, 0), 0);
  private dragOffset = new Vector3();
  private intersectionPoint = new Vector3();

  private hoveredEntity: number | null = null;
  private currentWorld: IWorld | null = null;

  constructor(
    private camera: PerspectiveCamera,
    private eventBus: EventBus,
    private canvas: HTMLCanvasElement,
    private networkClient: NetworkClient
  ) {
    this.setupListeners();
  }

  private setupListeners(): void {
    this.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
    this.canvas.addEventListener('pointerup', this.onPointerUp.bind(this));
    window.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  private updateMouse(event: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    this.updateMouse(event);
    this.isMouseDown = true;
    this.justPressed = true;
  }

  private onPointerMove(event: PointerEvent): void {
    this.updateMouse(event);
  }

  private onPointerUp(event: PointerEvent): void {
    if (event.button !== 0) return;
    this.isMouseDown = false;
    this.justReleased = true;
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'r' && this.hoveredEntity !== null && this.currentWorld !== null) {
      if (
        hasComponent(this.currentWorld, CardSlotTag, this.hoveredEntity) || 
        hasComponent(this.currentWorld, CardTag, this.hoveredEntity)
      ) {
        this.networkClient.sendAction(MessageType.CLIENT_SHUFFLE_SLOT, { eid: this.hoveredEntity });
      }
    }
  }

  public update(world: IWorld, _dt: number): void {
    this.currentWorld = world;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    this.updateHoveredEntity();
    if (this.justPressed) this.handleDragStart(world);
    if (this.isMouseDown && this.draggedEntity !== null) this.handleDragMove();
    if (this.justReleased) this.handleDragRelease();
  }

  private updateHoveredEntity(): void {
    const meshes = Array.from(RenderableStorage.values());
    const hits = this.raycaster.intersectObjects(meshes, false);
    if (hits.length > 0 && hits[0].object.userData.entityId !== undefined) {
      this.hoveredEntity = hits[0].object.userData.entityId;
    } else {
      this.hoveredEntity = null;
    }
  }

  private handleDragStart(world: IWorld): void {
    this.justPressed = false;
    const meshes = Array.from(RenderableStorage.values());
    const hits = this.raycaster.intersectObjects(meshes, false);
    if (hits.length === 0) return;
    
    const hit = hits[0];
    const eid = hit.object.userData.entityId;
    if (eid !== undefined && hasComponent(world, InteractableComponent, eid)) {
      this.beginDrag(eid, hit);
    }
  }

  private beginDrag(eid: number, hit: Intersection): void {
    this.draggedEntity = eid;
    InteractableComponent.isDragged[eid] = 1;
    this.dragPlane.setComponents(0, 1, 0, -(hit.point.y + 0.5));
    this.dragOffset.copy(hit.point).sub(hit.object.position);
    
    TransformComponent.rotation.x[eid] = 0;
    TransformComponent.rotation.y[eid] = 0;
    TransformComponent.rotation.z[eid] = 0;
    TransformComponent.rotation.w[eid] = 1;

    this.networkClient.sendAction(MessageType.CLIENT_GRAB, { eid });
    this.eventBus.publish(EventType.ENTITY_DRAGGED, { eid });
  }

  private handleDragMove(): void {
    this.raycaster.ray.intersectPlane(this.dragPlane, this.intersectionPoint);
    if (this.intersectionPoint && this.draggedEntity !== null) {
      const newPos = this.intersectionPoint.sub(this.dragOffset);
      const eid = this.draggedEntity;
      TransformComponent.position.x[eid] = newPos.x;
      TransformComponent.position.y[eid] = newPos.y;
      TransformComponent.position.z[eid] = newPos.z;
      
      this.networkClient.sendAction(MessageType.CLIENT_MOVE, { 
        eid, pos: { x: newPos.x, y: newPos.y, z: newPos.z } 
      });
    }
  }

  private handleDragRelease(): void {
    this.justReleased = false;
    if (this.draggedEntity !== null) {
      const eid = this.draggedEntity;
      InteractableComponent.isDragged[eid] = 0;
      this.networkClient.sendAction(MessageType.CLIENT_RELEASE, { eid });
      this.eventBus.publish(EventType.ENTITY_RELEASED, { eid });
      this.draggedEntity = null;
    }
  }
}
