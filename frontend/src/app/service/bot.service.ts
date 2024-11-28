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

export type ModelConfig = {
  stt_model: string,
  llm_model: string,
  tts_model: string
}

@Injectable({
  providedIn: 'root'
})
export class BotService {
  constructor(private httpClient: HttpClient) {}

  sendMessage(text: string, config: ModelConfig): Observable<AssistantResponse> {
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
