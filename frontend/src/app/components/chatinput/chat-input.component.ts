import {Component, EventEmitter, Output} from '@angular/core';
import {NgxBootstrapIconsModule} from "ngx-bootstrap-icons";
import {AudioService} from "../../service/audio.service";
import {FormControl, ReactiveFormsModule} from "@angular/forms";

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
  @Output() sendText = new EventEmitter<string>()
  @Output() sendAudio = new EventEmitter<Blob>()

  protected textInput = new FormControl();
  protected recording: boolean = false

  constructor(private audioService: AudioService) {
  }

  async startRecording() {
    await this.audioService.startRecording();
    this.recording = true;
  }

  async stopRecording() {
    await this.audioService.stopRecording();
    this.recording = false;

    // this.sendAudio.emit()
  }

  sendMessage(event: Event) {
    event.preventDefault()

    const text = this.textInput.value;

    this.textInput.setValue('');
    this.sendText.emit(text);
  }
}
