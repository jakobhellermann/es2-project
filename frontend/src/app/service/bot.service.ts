import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {Injectable} from "@angular/core";

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
    return this.httpClient.post<AssistantResponse>('/api/assistant/text', {
      text,
      config
    })
  }

  sendAudioFile(audioBlob: Blob, config: ModelConfig): Observable<AssistantResponse> {
    return this.httpClient.post<AssistantResponse>(`/api/assistant/audio?stt_model=${config.stt_model}&llm_model=${config.llm_model}&tts_model=${config.tts_model}`, audioBlob, {
      headers: {
        'Content-Type': 'audio/wav'
      }
    })
  }
}
