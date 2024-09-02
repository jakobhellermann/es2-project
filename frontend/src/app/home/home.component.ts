import { Component } from '@angular/core';
import {Observable, ReplaySubject} from "rxjs";
import {ReactiveFormsModule} from "@angular/forms";
import {AsyncPipe, NgClass, NgForOf, NgIf, NgSwitch, NgSwitchCase} from "@angular/common";
import {NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle, NgbTooltip} from "@ng-bootstrap/ng-bootstrap";
import {NgxBootstrapIconsModule} from "ngx-bootstrap-icons";
import {MenuComponent} from "../components/menu/menu.component";
import {GridComponent} from "../grid/grid.component";
import {ChatComponent} from "../components/chat/chat.component";
import {SingleComponent} from "../single/single.component";
import {defaultModelConfig, LlmModel, ModelConfig, SttModel, TtsModel} from "../service/bot.service";

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
    MenuComponent,
    GridComponent,
    ChatComponent,
    SingleComponent,
    NgSwitchCase,
    NgSwitch
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  protected viewMode$ = new ReplaySubject<string>();
  protected _viewMode: Observable<string>;
  protected config$ = new ReplaySubject<ModelConfig>();
  protected _config: Observable<ModelConfig>;
  protected activeConfig$ = new ReplaySubject<ModelConfig>();
  protected _activeConfig: Observable<ModelConfig>;

  constructor() {
    this.viewMode$.next('single')
    this.config$.next(defaultModelConfig)
    this._viewMode = this.viewMode$.asObservable()
    this._config = this.config$.asObservable()
    this._activeConfig = this.activeConfig$.asObservable()
  }

  /*test() {
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
  }*/

  onViewMode(mode: string) {
    this.viewMode$.next(mode)
    this.activeConfig$.next(defaultModelConfig)
  }

  onConfig(config: ModelConfig) {
    this.config$.next(config)
  }

  onActiveConfig(config: ModelConfig) {
    this.activeConfig$.next(config)
  }
}
