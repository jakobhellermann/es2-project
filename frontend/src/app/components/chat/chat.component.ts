import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {AsyncPipe, NgClass, NgForOf, NgIf} from "@angular/common";
import {NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {ReactiveFormsModule} from "@angular/forms";
import {Observable, ObservableInput, ReplaySubject, tap} from "rxjs";
import {AssistantResponse, BotService} from "../../service/bot.service";
import {AudioService} from "../../service/audio.service";

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
export class ChatComponent implements OnInit {
  @Input() prompt!: Observable<string>
  @ViewChild('audio', { static: false }) audioElement!: ElementRef<HTMLAudioElement>;

  private messages: MessageType[] = []
  readonly _messages: Observable<MessageType[]>
  protected messages$ = new ReplaySubject<MessageType[]>()

  constructor(private botService: BotService, private audioService: AudioService) {
    this._messages = this.messages$.asObservable();
  }

  ngOnInit() {
    this.prompt.pipe(tap((prompt) => {
      this.insertRequest(prompt)

      this.botService.sendMessage(prompt).pipe(tap(async (res) => {
        await this.onResponse(res)
      })).subscribe();
    })).subscribe()

    this.audioService.getAudioBlob().subscribe(blob => {
      // this.loading = true

      this.botService.sendAudioFile(blob).pipe(tap(async (res) => {
        const lastMessage = this.messages[this.messages.length - 1];

        lastMessage.message = res.result.input_transcription;
        lastMessage.loading = false;

        await this.onResponse(res) // TODO ui not updating
      })).subscribe();
    });
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
    // this.loading = false

    // await this.audioService.playAudio(res.result.url, this.audioElement);
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
