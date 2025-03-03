import {Injectable} from "@angular/core";
import { Socket } from "socket.io-client";

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
  sendMessage(socket: Socket, text: string, config: ModelConfig) {
    socket.emit('send_message', {
      text,
      ...config,
    });
  }

  sendAudioFile(socket: Socket, audio: Blob, config: ModelConfig) {
    socket.emit('send_message', {
      audio,
      ...config,
    });
  }
}
