import {Component, ElementRef, ViewChild} from '@angular/core';
import {NgxBootstrapIconsModule} from "ngx-bootstrap-icons";
import {ChatInputComponent} from "../components/chatinput/chat-input.component";
import {ChatComponent} from "../components/chat/chat.component";
import {NgForOf, NgIf, NgStyle} from "@angular/common";
import {BotConfigService} from "../service/bot-config.service";
import {AudioService} from "../service/audio.service";

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
  @ViewChild('audioGrid', { static: false }) audioElement!: ElementRef<HTMLAudioElement>;

  protected activeChats: number[] = [0];
  protected selectedChat: number = 0;

  constructor(private botConfig: BotConfigService, private audioService: AudioService) {}

  addChat(index: number) {
    this.activeChats.push(index)
  }

  selectChat(index: number) {
    if (this.activeChats.includes(index)) {
      this.selectedChat = index
      this.botConfig.getActiveConfigIndex().next(index + 1)
    }
  }

  async playAudio(index: number, url: string) {
    if (this.selectedChat === index) {
      await this.audioService.playAudio(url, this.audioElement)
    }
  }
}
