import {Component, EventEmitter, Output} from '@angular/core';
import {NgxBootstrapIconsModule} from "ngx-bootstrap-icons";
import {AudioService} from "../../service/audio.service";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {BotConfigService} from "../../service/bot-config.service";

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [
    NgxBootstrapIconsModule,
    ReactiveFormsModule
  ],
  templateUrl: './chat-input.component.html',
  styleUrl: './chat-input.component.css',
})
export class ChatInputComponent {
  protected textInput = new FormControl();
  protected recording: boolean = false

  constructor(private audioService: AudioService, private botConfig: BotConfigService) {
  }

  async startRecording() {
    await this.audioService.startRecording();
    this.recording = true;
  }

  async stopRecording() {
    await this.audioService.stopRecording();
    this.recording = false;
  }

  sendMessage(event: Event) {
    event.preventDefault()

    const text = this.textInput.value;

    this.textInput.setValue('');

    this.botConfig.broadcastPrompt(text);
  }
}
