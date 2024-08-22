import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {Observable, ReplaySubject, tap} from "rxjs";
import {ReactiveFormsModule, UntypedFormControl} from "@angular/forms";
import {AssistantResponse, BotService} from "../service/bot.service";
import {AsyncPipe, NgClass, NgForOf, NgIf} from "@angular/common";
import {AudioService} from "../service/audio.service";
import {NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle, NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {NgxBootstrapIconsModule} from "ngx-bootstrap-icons";
import {MenuComponent} from "../components/menu/menu.component";

type MessageType = {
  message: string,
  reply: boolean,
  loading: boolean,
  telemetry: {
    stt: string,
    tts: string,
    llm: string
  } | null,
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AsyncPipe,
    NgForOf,
    NgClass,
    NgIf,
    NgbTooltip,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem,
    NgxBootstrapIconsModule,
    MenuComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  @ViewChild('audio', { static: false }) audioElement!: ElementRef<HTMLAudioElement>;

  textInput = new UntypedFormControl()

  private messages: MessageType[] = []
  readonly _messages: Observable<MessageType[]>
  protected messages$ = new ReplaySubject<MessageType[]>()

  protected loading: boolean = false
  protected recording: boolean = false

  constructor(private botService: BotService, private audioService: AudioService) {
    this._messages = this.messages$.asObservable();
  }

  ngOnInit() {
    this.audioService.getAudioBlob().subscribe(blob => {
      this.loading = true

      this.botService.sendAudioFile(blob).pipe(tap(async (res) => {
        const lastMessage = this.messages[this.messages.length - 1];

        lastMessage.message = res.result.input_transcription;
        lastMessage.loading = false;

        await this.onResponse(res) // TODO ui not updating
      })).subscribe();
    });
  }

  test() {
    const text = this.textInput.value;

    this.insertRequest(text);

    this.messages.push({
      message: '',
      reply: true,
      telemetry: null,
      loading: false
    });

    this.messages$.next(this.messages)

    this.botService.test(text, (res) => {
      const lastMessage = this.messages[this.messages.length - 1];

      lastMessage.message += res;
    })
  }

  async startRecording() {
    await this.audioService.startRecording();
    this.recording = true;
  }

  async stopRecording() {
    await this.audioService.stopRecording();
    this.recording = false;

    this.insertRequest('Loading...', true);
  }

  sendMessage() {
    const text = this.textInput.value;

    this.insertRequest(text);
    this.textInput.setValue('');
    this.loading = true;

    this.botService.sendMessage(text).pipe(tap(async (res) => {
      await this.onResponse(res)
    })).subscribe();
  }

  private async onResponse(res: AssistantResponse) {
    this.messages.push({
      message: res.result.text,
      reply: true,
      telemetry: {
        stt: `${res.timings.time_stt.toFixed(2)}s`,
        tts: `${res.timings.time_tts.toFixed(2)}s`,
        llm: `${res.timings.time_llm.toFixed(2)}s`,
      },
      loading: false
    });

    this.messages$.next(this.messages)
    this.loading = false

    await this.audioService.playAudio(res.result.url, this.audioElement);
  }

  private insertRequest(text: string, loading: boolean = false) {
    this.messages.push({
      message: text,
      reply: false,
      telemetry: null,
      loading
    });

    this.messages$.next(this.messages)
  }
}
