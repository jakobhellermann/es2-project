import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import { AsyncPipe, NgClass, NgForOf, NgIf } from "@angular/common";
import { NgbTooltip } from "@ng-bootstrap/ng-bootstrap";
import { ReactiveFormsModule } from "@angular/forms";
import { Observable, ReplaySubject, tap } from "rxjs";
import { BotService, ModelConfig, ResponseUpdate, TimedResponse } from "../../service/bot.service";
import { AudioService } from "../../service/audio.service";
import { BotConfigService } from "../../service/bot-config.service";
import { marked } from "marked";
import {io, Socket} from "socket.io-client";
import * as Rx from "rxjs";
import {NgxBootstrapIconsModule} from "ngx-bootstrap-icons";

type MessageType = {
  message: string,
  reply: boolean,
  loading: boolean,
  url: string | null,
  playing: boolean,
  telemetry: {
    stt?: string,
    tts?: string,
    llm?: string;
  },
};

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    NgIf,
    NgbTooltip,
    ReactiveFormsModule,
    NgClass,
    NgForOf,
    AsyncPipe,
    NgxBootstrapIconsModule
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('audioElement', { static: false }) audioElement!: ElementRef<HTMLAudioElement>;

  @Input() index = -1;
  @Input() isSelected = false;
  @Output() onResponseEvent = new EventEmitter<string>();

  private socket: Socket;
  private stt_finished: Observable<TimedResponse<{transcription: string}>>;
  private llmUpdate: Observable<ResponseUpdate>;
  private llmFinished: Observable<TimedResponse>;
  private ttsFinished: Observable<TimedResponse<{url: string}>>;

  private readonly promptId: number;
  private messages: MessageType[] = [];
  readonly _messages: Observable<MessageType[]>;
  protected messages$ = new ReplaySubject<MessageType[]>();

  private loading: boolean = false;

  private modelConfig: ModelConfig = {
    stt_model: '',
    llm_model: '',
    tts_model: '',
  };

  constructor(private botService: BotService, private audioService: AudioService, private botConfig: BotConfigService) {
    this._messages = this.messages$.asObservable();
    this.promptId = botConfig.registerPrompt();

    this.socket = io("localhost:8080");
    this.stt_finished = Rx.fromEvent(this.socket, "response_stt_finished");
    this.llmUpdate = Rx.fromEvent(this.socket, "response_llm_update");
    this.llmFinished = Rx.fromEvent(this.socket, "response_llm_finished");
    this.ttsFinished = Rx.fromEvent(this.socket, "response_tts_finished");

    this.stt_finished.subscribe(this.onSTTFinished.bind(this))
    this.llmUpdate.subscribe(this.onLLMUpdate.bind(this))
    this.llmFinished.subscribe(this.onLLMFinished.bind(this))
    this.ttsFinished.subscribe(this.onTTSFinished.bind(this))
  }

  ngOnInit() {
    this.botConfig.prompt(this.promptId).pipe(tap((prompt) => {
      if (this.loading) {
        return;
      }

      this.loading = true;
      this.insert(prompt);

      this.insert('', false, true);
      this.botService.sendMessage(this.socket, prompt, this.modelConfig);
    })).subscribe();

    this.botConfig.config(this.index).pipe(tap((config) => {
      this.modelConfig = config;
    })).subscribe();

    this.audioService.audioBlob().pipe(tap((blob) => {
      if (this.loading) {
        return;
      }

      this.loading = true;
      this.insert('', true);

      this.botService.sendAudioFile(this.socket, blob, this.modelConfig);
    })).subscribe();
  }

  ngOnDestroy() {
    this.botConfig.unregisterPrompt(this.promptId);
  }

  private onSTTFinished(res: TimedResponse<{ transcription: string; }>) {
    let userMessage = this.lastMessage();
    userMessage.message = res.transcription;
    userMessage.loading = false;

    let responseMessage = this.insert('', false, true);
    responseMessage.telemetry.stt = `${res.time.toFixed(2)}s`;
  }
  private onLLMUpdate(res: ResponseUpdate) {
    console.log(".. " + res.segment);
    this.lastMessage().message += res.segment;
  }
  private async onLLMFinished(res: TimedResponse) {
    this.loading = false;

    let last = this.lastMessage();
    last.telemetry.llm = `${res.time.toFixed(2)}s`;
    last.loading = false;

    last.message = await marked.parse(last.message);
  }
  private onTTSFinished(res: TimedResponse<{ url: string; }>) {
    let last = this.lastMessage();
    last.url = res.url;
    last.telemetry.tts = `${res.time.toFixed(2)}s`;

    if (this.isSelected && this.audioService.isAutoPlayEnabled()) {
      this.playAudio(last)
    }
  }

  protected onPlayAudio(message: MessageType) {
    if (message.playing) {
      this.audioElement.nativeElement.pause()
      return
    }

    this.playAudio(message)
  }

  private playAudio(message: MessageType) {
    if (message.url) {
      message.playing = true
      this.audioElement.nativeElement.onended = () => { message.playing = false }
      this.audioElement.nativeElement.onpause = () => { message.playing = false }
      this.audioService.playAudio(message.url, this.audioElement);
    }
  }

  private insert(text: string, loading: boolean = false, reply: boolean = false): MessageType {
    let message = {
      message: text,
      reply,
      telemetry: {},
      loading,
      url: null,
      playing: false
    };
    this.messages.push(message);
    this.messages$.next(this.messages);

    return message;
  }

  private lastMessage(): MessageType {
    return this.messages[this.messages.length - 1];
  }
}
