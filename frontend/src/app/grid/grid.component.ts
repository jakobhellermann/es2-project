import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgxBootstrapIconsModule} from "ngx-bootstrap-icons";
import {ChatInputComponent} from "../components/chatinput/chat-input.component";
import {ChatComponent} from "../components/chat/chat.component";
import {Observable, ReplaySubject, tap} from "rxjs";
import {NgForOf, NgIf, NgStyle} from "@angular/common";
import {defaultModelConfig, LlmModel, ModelConfig, SttModel, TtsModel} from "../service/bot.service";

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
  @Input() config!: Observable<ModelConfig>
  @Output() activeConfig = new EventEmitter<ModelConfig>()

  protected activeChats: number[] = [0];
  protected selectedChat: number = 0;
  protected prompts$: ReplaySubject<string>[] = [];
  protected _prompts: Observable<string>[] = [];

  protected configs: ModelConfig[] = []
  protected configs$ : ReplaySubject<ModelConfig>[] = []
  protected _configs: Observable<ModelConfig>[] = []

  constructor() {
    for (let _ in [0, 1, 2, 3]) {
      const prompt$ = new ReplaySubject<string>()
      this.prompts$.push(prompt$);
      this._prompts.push(prompt$.asObservable())

      const config$ = new ReplaySubject<ModelConfig>()
      config$.next(defaultModelConfig)
      this.configs$.push(config$)
      this._configs.push(config$.asObservable())

      this.configs.push(defaultModelConfig)
    }
  }

  ngOnInit() {
    this.config.pipe(tap((config) => {
      if (this.activeChats.includes(this.selectedChat)) {
        this.configs[this.selectedChat] = config
        this.configs$[this.selectedChat].next(config)
      }
    })).subscribe()
  }

  onSendText(text: string) {
    this.activeChats.forEach((_, key) => {
      this.prompts$[key].next(text)
    })
  }

  addChat(index: number) {
    this.activeChats.push(index)
  }

  selectChat(index: number) {
    if (this.activeChats.includes(index)) {
      this.selectedChat = index
      this.activeConfig.emit(this.configs[this.selectedChat])
    }
  }
}
