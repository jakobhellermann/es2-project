import { Component } from '@angular/core';
import {NgxBootstrapIconsModule} from "ngx-bootstrap-icons";
import {ChatInputComponent} from "../components/chatinput/chat-input.component";
import {ChatComponent} from "../components/chat/chat.component";
import {Observable, ReplaySubject} from "rxjs";
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [
    NgxBootstrapIconsModule,
    ChatInputComponent,
    ChatComponent,
    NgIf
  ],
  templateUrl: './grid.component.html',
  styleUrl: './grid.component.css'
})
export class GridComponent {
  protected activeChats: number[] = [];

  readonly _prompt: Observable<string>
  protected prompt$ = new ReplaySubject<string>()

  constructor() {
    this._prompt = this.prompt$.asObservable();
  }

  onSendText(text: string) {
    this.prompt$.next(text);
  }

  addChat(index: number) {
    this.activeChats.push(index)
  }
}
