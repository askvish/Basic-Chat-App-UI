import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
} from '@angular/animations';
import { Message, WebSocketService } from '../../services/websocket.service';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageComponent } from '../message/message.component';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-chat',
  imports: [
    CommonModule,
    FormsModule,
    MessageComponent,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
  ],

  standalone: true,
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  animations: [
    trigger('messageAnimation', [
      transition('* => *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(20px)' }),
            stagger(100, [
              animate(
                '300ms ease-out',
                style({ opacity: 1, transform: 'translateY(0)' })
              ),
            ]),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
})
export class ChatComponent implements OnInit, AfterViewChecked {
  username = '';
  message = '';
  messages: Message[] = [];
  hasJoined = false;

  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  constructor(private webSocketService: WebSocketService) {}

  ngOnInit(): void {
    this.webSocketService.messages$.subscribe((message) => {
      this.messages = message;
      this.scrollToBottom();
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.messageContainer.nativeElement.scrollTop =
        this.messageContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  joinChat(): void {
    if (this.username.trim()) {
      this.webSocketService.connect(this.username);
      this.webSocketService.connectionStatus$.subscribe((status) => {
        this.hasJoined = status;
      });
    }
  }

  sendMessage(): void {
    if (this.message.trim() && this.hasJoined) {
      this.webSocketService.sendMessage(this.username, this.message);
      this.message = '';
    }
  }

  leaveChat(): void {
    if (this.hasJoined) {
      this.webSocketService.disconnect(this.username);
      this.hasJoined = false;
    }
  }
}
