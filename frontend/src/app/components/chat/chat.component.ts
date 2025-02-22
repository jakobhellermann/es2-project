import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {AsyncPipe, NgClass, NgForOf, NgIf} from "@angular/common";
import {NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {ReactiveFormsModule} from "@angular/forms";
import {catchError, Observable, ReplaySubject, tap, throwError} from "rxjs";
import {AssistantResponse, BotService, ModelConfig} from "../../service/bot.service";
import {AudioService} from "../../service/audio.service";
import {BotConfigService} from "../../service/bot-config.service";
import {marked} from "marked";

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
    this.botConfig.prompt(this.promptId).pipe(tap((prompt) => {
      if (this.loading) {
        return
      }

      this.loading = true;
      this.insert(prompt)
      this.insert('', true, true)

      this.botService.sendMessage(prompt, this.modelConfig)
        .pipe(catchError(() => {
          this.loading = false
          this.modifyLast('Ein Fehler ist aufgetreten. Bitte versuche es noch einmal.', false, {}).then()
          return throwError(() => new Error('Ein Fehler ist aufgetreten. Bitte versuche es noch einmal.'))
        }))
        .subscribe(async (res) => {
          await this.onResponse(res, true)
        })
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

      this.botService.sendAudioFile(blob, this.modelConfig)
        .pipe(catchError(() => {
          this.loading = false
          this.modifyLast('Ein Fehler ist aufgetreten. Bitte versuche es noch einmal.', false, {}).then()
          return throwError(() => new Error('Ein Fehler ist aufgetreten. Bitte versuche es noch einmal.'))
        }))
        .subscribe(async (res) => {
          await this.modifyLast(res?.result.input_transcription, false)

          await this.onResponse(res)
        })
    })).subscribe();
  }

  ngOnDestroy() {
    this.botConfig.unregisterPrompt(this.promptId)
  }

  private async onResponse(res: AssistantResponse, modify: boolean = false) {
    this.loading = false;

    const telemetry = {
      stt: `${res.timings.time_stt.toFixed(2)}s`,
      tts: `${res.timings.time_tts.toFixed(2)}s`,
      llm: `${res.timings.time_llm.toFixed(2)}s`,
    }

    this.onResponseEvent.emit(res.result.url)

    if (modify) {
      await this.modifyLast(res.result.text, false, telemetry)
      return
    }

    this.messages.push({
      message: res.result.text,
      reply: true,
      telemetry,
      loading: false
    });

    this.messages$.next(this.messages)
  }

  private insert(text: string, loading: boolean = false, reply: boolean = false) {
    this.messages.push({
      message: text,
      reply,
      telemetry: null,
      loading
    });

    this.messages$.next(this.messages)
  }

  private async modifyLast(message: string, loading: boolean = false, telemetry: any = {}) {
    const lastMessage = this.messages[this.messages.length - 1];

    lastMessage.message = await marked.parse(message);
    lastMessage.loading = loading;
    lastMessage.telemetry = telemetry;
  }
}
