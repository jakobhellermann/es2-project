import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {NgxBootstrapIconsModule} from "ngx-bootstrap-icons";
import {NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {BotService, LlmModel, ModelConfig, SttModel, TtsModel} from "../../service/bot.service";
import {KeyValuePipe, NgForOf} from "@angular/common";
import {config, Observable, tap} from "rxjs";

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgxBootstrapIconsModule,
    NgbTooltip,
    NgForOf,
    KeyValuePipe
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css',
})
export class MenuComponent implements OnInit {
  @Input() activeConfig!: Observable<ModelConfig>
  @Output() viewMode = new EventEmitter<string>()
  @Output() config = new EventEmitter<ModelConfig>()

  protected readonly SttModel = SttModel;
  protected readonly LlmModel = LlmModel;
  protected readonly TtsModel = TtsModel;

  protected modelGroup = new FormGroup({
    stt_model: new FormControl<SttModel>(SttModel.Whisper),
    llm_model: new FormControl<LlmModel>(LlmModel.Mistral),
    tts_model: new FormControl<TtsModel>(TtsModel['Facebook TTS']),
  })
  protected radioControl = new FormControl('single')

  protected collapsed: boolean = false;

  constructor(private botService: BotService) {
  }

  ngOnInit() {
    this.modelGroup.valueChanges.subscribe((values) => {
      this.config.emit({
          stt_model: values.stt_model as SttModel,
          llm_model: values.llm_model as LlmModel,
          tts_model: values.tts_model as TtsModel
      })
    })

    this.radioControl.valueChanges.subscribe((value) => {
      if (!value) {
        return
      }

      this.viewMode.emit(value)
    })

    this.activeConfig.pipe(tap((config) => {
      this.modelGroup.setValue(config)
    })).subscribe()
  }

  protected toggleCollapsed() {
    this.collapsed = !this.collapsed;
  }
}
