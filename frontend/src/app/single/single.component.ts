import {Component, Input} from '@angular/core';
import {ChatComponent} from "../components/chat/chat.component";
import {ChatInputComponent} from "../components/chatinput/chat-input.component";
import {Observable, ReplaySubject} from "rxjs";
import {ModelConfig} from "../service/bot.service";
import {BotConfigService} from "../service/bot-config.service";

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
  constructor(private botConfig: BotConfigService) {
    this.botConfig.getActiveConfigIndex().next(0)
  }
}
