import {HttpClient} from "@angular/common/http";
import {Observable, tap} from "rxjs";
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

@Injectable({
  providedIn: 'root'
})
export class BotService {
  constructor(private httpClient: HttpClient) {
  }

  sendMessage(text: string): Observable<AssistantResponse> {
    return this.httpClient.post<AssistantResponse>('http://localhost:8080/assistant/text', {
      text
    })
  }

  sendAudioFile(audioBlob: Blob): Observable<AssistantResponse> {
    return this.httpClient.post<AssistantResponse>('http://localhost:8080/assistant/audio', audioBlob, {
      headers: {
        'Content-Type': 'audio/wav'
      }
    })
  }
}
