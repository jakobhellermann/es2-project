import {ElementRef, Injectable} from "@angular/core";
import {Observable, ReplaySubject, tap} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  protected audioData: any[] = [];
  protected audioContext: AudioContext = new AudioContext();
  protected mediaStream: MediaStream | null = null;
  protected mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  protected audioWorkletNode: AudioWorkletNode | null = null;

  protected audioBlob$ = new ReplaySubject<Blob>();
  protected _audioBlob: Observable<Blob>;

  constructor() {
    this._audioBlob = this.audioBlob$.asObservable()

    this.setup();
  }

  audioBlob(): Observable<Blob> {
    return this._audioBlob;
  }

  async playAudio(url: string, el: ElementRef<HTMLAudioElement>) {
    el.nativeElement.src = url;
    await el.nativeElement.play();
  }

  async setup() {
    this.audioContext = new AudioContext();

    await this.audioContext.audioWorklet.addModule('./assets/audio-processor.js')
    this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');

    this.audioWorkletNode.port.onmessage = (event) => {
      const inputBuffer = event.data;
      this.audioData.push(...inputBuffer);
    };
  }

  async startRecording() {
    this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaStreamSource = this.audioContext.createMediaStreamSource(this.mediaStream!);
    this.mediaStreamSource!.connect(this.audioWorkletNode!)
  }

  async stopRecording() {
    this.audioWorkletNode!.disconnect();
    this.mediaStream!.getTracks().forEach(track => track.stop());

    console.log(this.audioData)
    const audioBuffer = new Float32Array(this.audioData);
    const wavBlob = this.encodeWAV(audioBuffer);
    this.audioData = [];

    const blobUrl = URL.createObjectURL(wavBlob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = "aDefaultFileName.txt";
    link.innerText = "Click here to download the file";
    document.body.appendChild(link);
    link.click()

    this.audioBlob$.next(wavBlob);
  }

  private encodeWAV(samples: Float32Array) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // Write WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true); // Mono audio
    view.setUint32(24, 44100, true); // Sample rate
    view.setUint32(28, 44100 * 2, true); // Byte rate (Sample rate * block align)
    view.setUint16(32, 2, true); // Block align (bytes per sample * channels)
    view.setUint16(34, 16, true); // Bits per sample
    this.writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    this.floatTo16BitPCM(view, 44, samples);

    return new Blob([view], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  private floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  }
}
