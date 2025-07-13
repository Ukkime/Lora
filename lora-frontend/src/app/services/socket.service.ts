// src/app/socket.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, fromEvent, Subject } from 'rxjs';
import { environment } from '../../environments/environment'; // For backend URL

@Injectable({
  providedIn: 'root',
})
export class SocketService implements OnDestroy {
  private socket: Socket;
  private readonly BACKEND_URL =
    environment.backendUrl || 'http://localhost:3000'; // Or directly 'http://gallifrey.sytes.net:3000'

  public onConnect$: Observable<any>;
  public onDisconnect$: Observable<any>;
  public onQueueUpdate$: Observable<any>; // Example: for queue status updates
  public onMatchFound$: Observable<any>; // Example: when a match is found

  constructor() {
    this.socket = io(this.BACKEND_URL);

    // Expose observables for various socket events
    this.onConnect$ = fromEvent(this.socket, 'connect');
    this.onDisconnect$ = fromEvent(this.socket, 'disconnect');
    this.onQueueUpdate$ = fromEvent(this.socket, 'queueUpdate'); // Listen for custom events from backend
    this.onMatchFound$ = fromEvent(this.socket, 'matchFound'); // Listen for match found event
  }

  // Get the current Socket.IO ID
  public getSocketId(): string | undefined {
    return this.socket.id;
  }

  // Emit an event to the server
  public emit(eventName: string, data?: any): void {
    this.socket.emit(eventName, data);
  }

  // Listen to a specific event
  public listen(eventName: string): Observable<any> {
    return fromEvent(this.socket, eventName);
  }

  // Disconnect the socket when the service is destroyed (e.g., app closes)
  ngOnDestroy(): void {
    this.socket.disconnect();
  }
}
