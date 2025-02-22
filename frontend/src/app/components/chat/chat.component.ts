import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {AsyncPipe, NgClass, NgForOf, NgIf} from "@angular/common";
import {NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {ReactiveFormsModule} from "@angular/forms";
import {Observable, ReplaySubject, tap} from "rxjs";
import {BotService, ModelConfig, ResponseUpdate, TimedResponse} from "../../service/bot.service";
import {AudioService} from "../../service/audio.service";
import {BotConfigService} from "../../service/bot-config.service";

type MessageType = {
  message: string,
  reply: boolean,
  loading: boolean,
  telemetry: {
    stt?: string,
    tts?: string,
    llm?: string
  },
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    NgIf,
    NgbTooltip,
    ReactiveFormsModule,
    NgClass,
    NgForOf,
    AsyncPipe
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit, OnDestroy {
  @Input() index = -1
  @Output() onResponseEvent = new EventEmitter<string>()

  private readonly promptId: number;
  private messages: MessageType[] = []
  readonly _messages: Observable<MessageType[]>
  protected messages$ = new ReplaySubject<MessageType[]>()

  private loading: boolean = false;

  private modelConfig: ModelConfig = {
    stt_model: 'whisper',
    llm_model: 'mistral',
    tts_model: 'facebook-tts'
  }

  constructor(private botService: BotService, private audioService: AudioService, private botConfig: BotConfigService) {
    this._messages = this.messages$.asObservable();
    this.promptId = botConfig.registerPrompt()
  }

  ngOnInit() {
    this.botService.stt_finished.subscribe(this.onSTTFinished.bind(this));
    this.botService.llmUpdate.subscribe(this.onLLMUpdate.bind(this));
    this.botService.llmFinished.subscribe(this.onLLMFinished.bind(this));
    this.botService.ttsFinished.subscribe(this.onTTSFinished.bind(this));

    this.botConfig.prompt(this.promptId).pipe(tap((prompt) => {
      if (this.loading) {
        return
      }

      this.loading = true;
      this.insert(prompt)
      this.insert('', false, true)
      this.botService.sendMessage(prompt, this.modelConfig)
    })).subscribe()

    this.botConfig.config(this.index).pipe(tap((config) => {
      this.modelConfig = config
    })).subscribe()

    this.audioService.audioBlob().pipe(tap((blob) => {
      if (this.loading) {
        return
      }

      this.loading = true;
      this.insert('', true);

      this.botService.sendAudioFile(blob, this.modelConfig);
      /*this.botService.sendAudioFile(blob, this.modelConfig).pipe(tap(async (res) => {

        await this.onResponse(res)
      })).subscribe();*/
    })).subscribe();
  }

  ngOnDestroy() {
    this.botConfig.unregisterPrompt(this.promptId)
  }

  private onSTTFinished(res: TimedResponse<{ transcription: string }>) {
    let userMessage = this.lastMessage();
    userMessage.message = res.transcription;
    userMessage.loading = false;

    let responseMessage = this.insert('', false, true);
    responseMessage.telemetry.stt = `${res.time.toFixed(2)}s`;
  }
  private onLLMUpdate(res: ResponseUpdate) {
    console.log(".. " + res.segment)
    this.lastMessage().message += res.segment;
  }
  private onLLMFinished(res: TimedResponse) {
    this.loading = false;
    let last = this.lastMessage();
    last.telemetry.llm = `${res.time.toFixed(2)}s`;
    last.loading = false;
  }
  private onTTSFinished(res: TimedResponse<{url: string}>) {
    this.onResponseEvent.emit(res.url)

    let last = this.lastMessage();
    last.telemetry.tts = `${res.time.toFixed(2)}s`;
  }

  private insert(text: string, loading: boolean = false, reply: boolean = false): MessageType {
    let message = {
      message: text,
      reply,
      telemetry: {},
      loading
    }
    this.messages.push(message);
    this.messages$.next(this.messages)

    return message;
  }

  private lastMessage(): MessageType {
    return this.messages[this.messages.length - 1];
  }
}
