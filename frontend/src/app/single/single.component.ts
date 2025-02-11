import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {ChatComponent} from "../components/chat/chat.component";
import {ChatInputComponent} from "../components/chatinput/chat-input.component";
import {Observable, ReplaySubject} from "rxjs";
import {ModelConfig} from "../service/bot.service";
import {BotConfigService} from "../service/bot-config.service";
import {AudioService} from "../service/audio.service";

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
  @ViewChild('audioSingle', { static: false }) audioElement!: ElementRef<HTMLAudioElement>;

  constructor(private botConfig: BotConfigService, private audioService: AudioService) {
    this.botConfig.getActiveConfigIndex().next(0)
  }

  async playAudio(url: string) {
    await this.audioService.playAudio(url, this.audioElement)
  }
}
