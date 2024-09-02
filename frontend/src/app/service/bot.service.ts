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

export type ModelConfig = {
  stt_model: SttModel,
  llm_model: LlmModel,
  tts_model: TtsModel
}

export const defaultModelConfig: ModelConfig = {
  stt_model: SttModel.Whisper,
  llm_model: LlmModel.Mistral,
  tts_model: TtsModel["Facebook TTS"]
}

@Injectable({
  providedIn: 'root'
})
export class BotService {
  constructor(private httpClient: HttpClient) {
  }

  sendMessage(text: string, config: ModelConfig): Observable<AssistantResponse> {
    console.log(config)
    return this.httpClient.post<AssistantResponse>('http://localhost:8080/assistant/mock', {
      text
    })
  }

  sendAudioFile(audioBlob: Blob, config: ModelConfig): Observable<AssistantResponse> {
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
