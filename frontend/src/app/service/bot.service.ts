import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {Injectable} from "@angular/core";
import oboe, {CallbackSignature} from "oboe";

export type AssistantResponse = {
  "timings": {
    "time_stt": number,
    "time_llm": number,
    "time_tts": number,
  },
  "result": {
    "input_transcription": string,
    "text": string,
    "url": string,
  },
}

export enum SttModel {
  Whisper = 'whisper',
  Whisper2 = 'whisper2'
}

export enum LlmModel {
  Mistral = 'mistral'
}

export enum TtsModel {
  'Facebook TTS' = 'facebook'
}

type ModelConfig = {
  stt_model: SttModel,
  llm_model: string,
  tts_model: string
}

@Injectable({
  providedIn: 'root'
})
export class BotService {
  private modelConfig: ModelConfig = {
    stt_model: SttModel.Whisper,
    llm_model: LlmModel.Mistral,
    tts_model: TtsModel["Facebook TTS"]
  }

  constructor(private httpClient: HttpClient) {
  }

  setModelConfig(config: ModelConfig) {
    this.modelConfig = config
  }

  getModelConfig() {
    return this.modelConfig
  }

  sendMessage(text: string): Observable<AssistantResponse> {
    return this.httpClient.post<AssistantResponse>('http://localhost:8080/assistant/mock', {
      text
    })
  }

  sendAudioFile(audioBlob: Blob): Observable<AssistantResponse> {
    return this.httpClient.post<AssistantResponse>('http://localhost:8080/assistant/mock', audioBlob, {
      headers: {
        'Content-Type': 'audio/wav'
      }
    })
  }

  test(prompt: string, callback: CallbackSignature) {
    oboe({
      method: 'POST',
      url: 'http://localhost:11434/api/generate',
      body: {
        model: 'example',
        prompt
      }
    }).node('!.response', callback)
  }
}
