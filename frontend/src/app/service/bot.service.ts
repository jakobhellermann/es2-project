import { Injectable } from "@angular/core";
import { Socket } from "socket.io-client";

export type ModelConfig = {
  stt_model: string,
  llm_model: string,
  tts_model: string;
};

export type ResponseUpdate = {
  segment: string;
};
export type TimedResponse<T = {}> = T & { time: number; };

export type ContextMessage = { message: string, reply: boolean; };

@Injectable({
  providedIn: 'root'
})
export class BotService {
  sendMessage(socket: Socket, text: string, context: ContextMessage[], config: ModelConfig) {
    socket.emit('send_message', {
      text,
      context,
      ...config,
    });
  }

  sendAudioFile(socket: Socket, audio: Blob, context: ContextMessage[], config: ModelConfig) {
    socket.emit('send_message', {
      audio,
      context,
      ...config,
    });
  }
}
