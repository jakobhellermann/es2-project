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
    const query = new URLSearchParams(config).toString();

    return this.httpClient.post<AssistantResponse>(`/api/assistant/text?${query}`, {
      text,
    })
  }

  sendAudioFile(audioBlob: Blob, config: ModelConfig): Observable<AssistantResponse> {
    const query = new URLSearchParams(config).toString();

    return this.httpClient.post<AssistantResponse>(`/api/assistant/audio?${query}`, audioBlob, {
      headers: {
        'Content-Type': 'audio/wav'
      }
    })
  }
}
