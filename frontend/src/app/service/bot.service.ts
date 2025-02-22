import {Observable, fromEvent} from "rxjs";
import * as Rx from "rxjs";
import {Injectable} from "@angular/core";
import { io, Socket } from "socket.io-client";

export type ModelConfig = {
  stt_model: string,
  llm_model: string,
  tts_model: string
}

export type ResponseUpdate = {
  segment: string;
};
export type TimedResponse<T = {}> = T & { time: number };

@Injectable({
  providedIn: 'root'
})
export class BotService {
  public stt_finished: Observable<TimedResponse<{transcription: string}>>;
  public llmUpdate: Observable<ResponseUpdate>;
  public llmFinished: Observable<TimedResponse>;
  public ttsFinished: Observable<TimedResponse<{url: string}>>;

  private socket: Socket;

  constructor() {
    this.socket = io("localhost:8080");
    this.stt_finished = Rx.fromEvent(this.socket, "response_stt_finished");
    this.llmUpdate = Rx.fromEvent(this.socket, "response_llm_update");
    this.llmFinished = Rx.fromEvent(this.socket, "response_llm_finished");
    this.ttsFinished = Rx.fromEvent(this.socket, "response_tts_finished");
  }

  sendMessage(text: string, config: ModelConfig) {
    this.socket.emit('send_message', {
      text,
      ...config,
    });
  }

  sendAudioFile(audio: Blob, config: ModelConfig) {
    this.socket.emit('send_message', {
      audio,
      ...config,
    });
  }
}
