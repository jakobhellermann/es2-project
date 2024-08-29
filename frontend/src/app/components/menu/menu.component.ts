import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {NgxBootstrapIconsModule} from "ngx-bootstrap-icons";
import {NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {BotService, LlmModel, SttModel, TtsModel} from "../../service/bot.service";
import {KeyValuePipe, NgForOf} from "@angular/common";

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
  @Output() viewMode = new EventEmitter<string>()

  protected readonly SttModel = SttModel;
  protected readonly LlmModel = LlmModel;
  protected readonly TtsModel = TtsModel;

  protected modelGroup = new FormGroup({
    sttSelect: new FormControl<SttModel>(SttModel.Whisper),
    llmSelect: new FormControl<LlmModel>(LlmModel.Mistral),
    ttsSelect: new FormControl<TtsModel>(TtsModel['Facebook TTS']),
  })
  protected radioControl = new FormControl('single')

  protected collapsed: boolean = false;

  constructor(private botService: BotService) {
  }

  ngOnInit() {
    this.modelGroup.valueChanges.subscribe((values) => {
      this.botService.setModelConfig({
        stt_model: values.sttSelect as SttModel,
        llm_model: values.llmSelect as LlmModel,
        tts_model: values.ttsSelect as TtsModel
      })
    })

    this.radioControl.valueChanges.subscribe((value) => {
      if (!value) {
        return
      }

      this.viewMode.emit(value)
    })
  }

  protected toggleCollapsed() {
    this.collapsed = !this.collapsed;
  }
}
