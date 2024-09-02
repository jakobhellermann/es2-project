import {Component, Input} from '@angular/core';
import {ChatComponent} from "../components/chat/chat.component";
import {ChatInputComponent} from "../components/chatinput/chat-input.component";
import {Observable, ReplaySubject} from "rxjs";
import {ModelConfig} from "../service/bot.service";

@Component({
  selector: 'app-single',
  standalone: true,
  imports: [
    ChatComponent,
    ChatInputComponent
  ],
  templateUrl: './single.component.html',
  styleUrl: './single.component.css'
})
export class SingleComponent {
  @Input() config!: Observable<ModelConfig>

  readonly _prompt: Observable<string>
  protected prompt$ = new ReplaySubject<string>()

  constructor() {
    this._prompt = this.prompt$.asObservable();
  }

  onSendText(text: string) {
    this.prompt$.next(text);
  }
}
