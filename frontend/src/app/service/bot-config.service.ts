import {Observable, ReplaySubject, tap} from "rxjs";
import {Injectable} from "@angular/core";
import {ModelConfig} from "./bot.service";
import {HttpClient} from "@angular/common/http";

type ModelResponse = {
  llm: string[],
  stt: string[],
  tts: string[]
}

@Injectable({
  providedIn: 'root'
})
export class BotConfigService {
  protected prompts$: (ReplaySubject<string> | null)[] = [];
  protected _prompts: (Observable<string> | null)[] = [];
  protected configs$: (ReplaySubject<ModelConfig> | null)[] = []
  protected _configs: (Observable<ModelConfig> | null)[] = []
  protected activeConfigIndex$ = new ReplaySubject<number>()
  protected _activeConfigIndex: Observable<number>

  protected configs: ModelConfig[] = [];
  protected activeConfigIndex: number = -1

  constructor(private httpClient: HttpClient) {
    for (let i = 0; i <= 5; i++) {
      const config$ = new ReplaySubject<ModelConfig>()
      this.configs$.push(config$)
      this.configs.push({
        stt_model: '',
        llm_model: '',
        tts_model: '',
      })
      this._configs.push(config$.asObservable())
    }

    this._activeConfigIndex = this.activeConfigIndex$.asObservable()

    this.activeConfigIndex$.pipe(tap((index) => {
      this.activeConfigIndex = index
    })).subscribe()
  }

  fetchModel() {
    return this.httpClient.get<ModelResponse>('/api/models')
  }

  updateAllConfigs(config: ModelConfig) {
    this.configs$.forEach((config$, index) => {
      config$?.next(config)
      this.configs[index] = config
    })
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
    this.configs[id] = config
  }

  getConfigObject(id: number) {
    return this.configs[id]
  }

  updateActiveConfig(config: ModelConfig) {
    this.setConfig(this.activeConfigIndex, config)
  }

  getActiveConfigIndex() {
    return this.activeConfigIndex$
  }
}
