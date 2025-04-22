import { Injectable } from '@angular/core';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Message {
  content: string;
  sender: string;
  type: 'CHAT' | 'JOIN' | 'LEAVE';
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private stompClient: any;
  private serverUrl = 'https://chat-app-by-ashok-2ae5a2c5f8df.herokuapp.com/ws';
  // private serverUrl = 'http://localhost:8080/ws';
  private messageSubject = new BehaviorSubject<Message[]>([]);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);

  public messages$: Observable<Message[]> = this.messageSubject.asObservable();
  public connectionStatus$: Observable<boolean> =
    this.connectionStatusSubject.asObservable();

  connect(username: string): void {
    const socket = new SockJS(this.serverUrl);
    this.stompClient = Stomp.over(socket);

    this.stompClient.connect(
      {},
      () => {
        this.connectionStatusSubject.next(true);

        // Subscribe to the public topic
        this.stompClient.subscribe('/topic/public', (payload: any) => {
          const message: Message = JSON.parse(payload.body);
          const currentMessages = this.messageSubject.getValue();
          this.messageSubject.next([...currentMessages, message]);
        });

        // Send join message
        this.sendJoinMessage(username);
      },
      this.onError
    );
  }

  disconnect(username: string): void {
    if (this.stompClient) {
      // Send leave message before disconnecting
      const leaveMessage = {
        sender: username,
        type: 'LEAVE',
      };
      this.stompClient.send(
        '/app/chat.leave',
        {},
        JSON.stringify(leaveMessage)
      );

      // Disconnect WebSocket
      this.stompClient.disconnect(() => {
        this.connectionStatusSubject.next(false);
      });
    } else {
      this.connectionStatusSubject.next(false);
    }
  }


  sendMessage(sender: string, content: string): void {
    if (this.stompClient && content.trim() !== '') {
      const chatMessage = {
        sender: sender,
        content: content,
        type: 'CHAT',
      };
      this.stompClient.send(
        '/app/chat.sendMessage',
        {},
        JSON.stringify(chatMessage)
      );
    }
  }

  private sendJoinMessage(username: string): void {
    this.stompClient.send(
      '/app/chat.join',
      {},
      JSON.stringify({ sender: username, type: 'JOIN' })
    );
  }

  private onError(error: any): void {
    console.error('WebSocket connection error:', error);
    this.connectionStatusSubject.next(false);
  }

  clearMessages(): void {
    this.messageSubject.next([]);
  }
}
