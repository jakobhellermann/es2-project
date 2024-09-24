import {Observable, ReplaySubject} from "rxjs";
import {Injectable} from "@angular/core";
import {defaultModelConfig, ModelConfig} from "./bot.service";

@Injectable({
  providedIn: 'root'
})
export class BotConfigService {
  protected prompts$: (ReplaySubject<string> | null)[] = [];
  protected _prompts: (Observable<string> | null)[] = [];
  protected configs$: (ReplaySubject<ModelConfig> | null)[] = []
  protected _configs: (Observable<ModelConfig> | null)[] = []
  protected activeConfig$ = new ReplaySubject<ModelConfig>()
  protected _activeConfig: Observable<ModelConfig>
  protected activeConfigId$ = new ReplaySubject<number>()
  protected _activeConfigId: Observable<number>

  protected configs: ModelConfig[] = [];

  constructor() {
    this._activeConfig = this.activeConfig$.asObservable()
    this._activeConfigId = this.activeConfigId$.asObservable()
  }

  registerPrompt() {
    const prompt$ = new ReplaySubject<string>()
    this.prompts$.push(prompt$);
    return this._prompts.push(prompt$.asObservable()) - 1
  }

  unregisterPrompt(id: number) {
    this.prompts$[id] = null;
    this._prompts[id] = null;
  }

  registerConfig(): number {
    const config$ = new ReplaySubject<ModelConfig>()
    config$.next(defaultModelConfig)
    this.configs$.push(config$)
    this.configs.push(defaultModelConfig)
    return this._configs.push(config$.asObservable()) - 1
  }

  unregisterConfig(id: number) {
    this.configs$[id] = null;
    this._configs[id] = null;
  }

  prompt(id: number): Observable<string> {
    return this._prompts[id]!;
  }

  broadcastPrompt(value: string) {
    this.prompts$.forEach((prompt$) => {
      if (prompt$) {
        prompt$.next(value);
      }
    })
  }

  config(id: number): Observable<ModelConfig> {
    return this._configs[id]!;
  }

  setConfig(id: number, config: ModelConfig) {
    this.configs$[id]!.next(config)
  }

  setActiveConfig(config: ModelConfig) {
    this.configs$[this._configs.indexOf(this._activeConfig)]!.next(config)
  }

  get activeConfig(): Observable<ModelConfig> {
    return this._activeConfig
  }

  set activeConfig(value: Observable<ModelConfig>) {
    this._activeConfig = value
    this.activeConfigId$.next(this._configs.indexOf(this._activeConfig))
  }

  get activeConfigId(): Observable<number> {
    return this._activeConfigId
  }

  getConfigObject(id: number) {
    return this.configs[id]
  }
}
