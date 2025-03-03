import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {NgxBootstrapIconsModule} from "ngx-bootstrap-icons";
import {BotService, ModelConfig} from "../../service/bot.service";
import {NgForOf} from "@angular/common";
import {tap} from "rxjs";
import {BotConfigService} from "../../service/bot-config.service";
import {AudioService} from "../../service/audio.service";

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgxBootstrapIconsModule,
    NgForOf
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css',
})
export class MenuComponent implements OnInit {
  @Output() viewMode = new EventEmitter<string>()

  protected modelGroup = new FormGroup({
    stt_model: new FormControl<string>('whisper'),
    llm_model: new FormControl<string>('mistral'),
    tts_model: new FormControl<string>('facebook-tts'),
  })
  protected radioControl = new FormControl('single')
  protected autoPlay = new FormControl('autoPlay')

  protected collapsed: boolean = false;
  protected sttModels: string[] = [];
  protected llmModels: string[] = [];
  protected ttsModels: string[] = [];

  constructor(private botConfig: BotConfigService, private audioService: AudioService) {
    botConfig.fetchModel().pipe(tap((models) => {
      this.sttModels = models.stt
      this.llmModels = models.llm
      this.ttsModels = models.tts

      const defaultModelConfig = {
        stt_model: models.stt[0],
        llm_model: models.llm[0],
        tts_model: models.tts[0],
      }

      this.modelGroup.setValue(defaultModelConfig)
      botConfig.updateAllConfigs(defaultModelConfig)
    })).subscribe()
  }

  ngOnInit() {
    this.modelGroup.valueChanges.subscribe((values) => {
      this.botConfig.updateActiveConfig(values as ModelConfig)
    })

    this.radioControl.valueChanges.subscribe((value) => {
      if (!value) {
        return
      }

      this.viewMode.emit(value)
    })

    this.autoPlay.valueChanges.subscribe((value) => {
      // @ts-ignore
      this.audioService.toggleAutoPlay(value)
    })

    this.botConfig.getActiveConfigIndex().pipe(tap((config) => {
      this.modelGroup.setValue(this.botConfig.getConfigObject(config), { emitEvent: false })
    })).subscribe()
  }

  protected toggleCollapsed() {
    this.collapsed = !this.collapsed;
  }
}
