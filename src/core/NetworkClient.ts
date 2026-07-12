import { EventBus } from './EventBus';
import { MessageType, NetworkMessage, StateUpdatePayload, ClientActionPayload } from './NetworkProtocol';

export class NetworkClient {
  private ws: WebSocket;
  public latestState: StateUpdatePayload | null = null;

  constructor(private eventBus: EventBus) {
    this.ws = new WebSocket('ws://localhost:8080');
    this.setupListeners();
  }

  private setupListeners(): void {
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as NetworkMessage;
      if (msg.type === MessageType.INIT_STATE || msg.type === MessageType.STATE_UPDATE) {
        this.latestState = msg.payload as StateUpdatePayload;
      }
    };
  }

  public sendAction(type: MessageType, payload: ClientActionPayload): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }
}
