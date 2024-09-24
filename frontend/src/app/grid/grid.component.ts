import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgxBootstrapIconsModule} from "ngx-bootstrap-icons";
import {ChatInputComponent} from "../components/chatinput/chat-input.component";
import {ChatComponent} from "../components/chat/chat.component";
import {Observable, ReplaySubject, tap} from "rxjs";
import {NgForOf, NgIf, NgStyle} from "@angular/common";
import {defaultModelConfig, LlmModel, ModelConfig, SttModel, TtsModel} from "../service/bot.service";
import {BotConfigService} from "../service/bot-config.service";

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
export class GridComponent implements OnInit {
  protected activeChats: number[] = [0];
  protected selectedChat: number = 0;

  protected configs: number[] = []

  constructor(private botConfig: BotConfigService) {
    this.configs.push(this.botConfig.registerConfig())
  }

  ngOnInit() {
    this.botConfig.activeConfig.pipe(tap((config) => {
      if (this.activeChats.includes(this.selectedChat)) {
        this.botConfig.setConfig(this.configs[this.selectedChat], config)
      }
    })).subscribe()
  }

  addChat(index: number) {
    this.activeChats.push(index)
    this.configs.push(this.botConfig.registerConfig())
  }

  selectChat(index: number) {
    if (this.activeChats.includes(index)) {
      this.selectedChat = index
      this.botConfig.activeConfig = this.botConfig.config(this.configs[index])
    }
  }
}
