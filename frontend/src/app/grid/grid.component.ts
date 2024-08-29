import { Component } from '@angular/core';
import {NgxBootstrapIconsModule} from "ngx-bootstrap-icons";
import {ChatInputComponent} from "../components/chatinput/chat-input.component";
import {ChatComponent} from "../components/chat/chat.component";
import {Observable, ReplaySubject} from "rxjs";
import {NgForOf, NgIf, NgStyle} from "@angular/common";

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [
    NgxBootstrapIconsModule,
    ChatInputComponent,
    ChatComponent,
    NgIf,
    NgForOf,
    NgStyle
  ],
  templateUrl: './grid.component.html',
  styleUrl: './grid.component.css'
})
export class GridComponent {
  protected activeChats: number[] = [0];
  protected prompts$: ReplaySubject<string>[] = [];
  protected _prompts: Observable<string>[] = [];

  constructor() {
    for (let index in [0, 1, 2, 3]) {
      const prompt$ = new ReplaySubject<string>()
      this.prompts$.push(prompt$);
      this._prompts.push(prompt$.asObservable())
    }
  }

  onSendText(text: string) {
    for (const chat in this.activeChats) {
      this.prompts$[chat].next(text)
    }
  }

  addChat(index: number) {
    this.activeChats.push(index)
  }
}
