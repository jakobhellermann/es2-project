import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Subject } from "rxjs";

type AssistantResponse = {
  "timings": {
    "time_llm": number,
    "time_tts": number,
  },
  "result": {
    "text": string,
    "url": string,
  },
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  @ViewChild('audio', { static: false }) audioElement!: ElementRef<HTMLAudioElement>;

  private chunks: any[] = [];
  private mediaRecorder: any;
  private audioContext: AudioContext = new AudioContext();
  private audioBlobSubject = new Subject<Blob>();
  audioURL: string | null = null;

  audioBlob$ = this.audioBlobSubject.asObservable();

  ngOnInit() {
    this.audioBlob$.subscribe(blob => {
      this.sendAudioFile(blob);
    });
  }

  async startRecording() {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream);
    this.mediaRecorder.ondataavailable = (event: any) => this.chunks.push(event.data);
    this.mediaRecorder.start();
  }

  async stopRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.onstop = async () => {
        const audioData = await new Blob(this.chunks).arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(audioData);
        const wavBlob = this.bufferToWave(audioBuffer, audioBuffer.length);
        this.audioBlobSubject.next(wavBlob);
        this.chunks = [];
      };

      this.mediaRecorder.stop();
    }
  }

  sendAudioFile(audioBlob: Blob) {
    fetch('http://localhost:8080/assistant/audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'audio/wav'  // Set the appropriate MIME type
      },
      body: audioBlob,

    })
      // .then(response => response.json())
      .then(async (data) => {
        const response = await data.json() as AssistantResponse
        // this.audioURL = window.URL.createObjectURL(blob);

        // optional download
        // const downloadLink = document.createElement('a');
        // downloadLink.href = this.audioURL;
        // downloadLink.download = 'recording.wav';
        // downloadLink.click();

        this.audioElement.nativeElement.src = response.result.url;
        await this.audioElement.nativeElement.play();
      })
      .catch(error => console.error('Error:', error));
  }
  bufferToWave(abuffer:any, len:number) {
    let numOfChan = abuffer.numberOfChannels,
      length = len * numOfChan * 2 + 44,
      buffer = new ArrayBuffer(length),
      view = new DataView(buffer),
      channels = [],
      i, sample,
      offset = 0,
      pos = 0;

    // write WAVE header
    setUint32(0x46464952);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"

    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // length = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2);                      // block-align
    setUint16(16);                                 // 16-bit (hardcoded in this demo)

    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length - pos - 8);                   // chunk length

    // write interleaved data
    for (i = 0; i < abuffer.numberOfChannels; i++)
      channels.push(abuffer.getChannelData(i));

    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {             // interleave channels
        sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
        view.setInt16(pos, sample, true);          // write 16-bit sample
        pos += 2;
      }
      offset++                                     // next source sample
    }

    // create Blob
    return new Blob([buffer], {type: "audio/wav"});

    function setUint16(data: any) {
      view.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data: any) {
      view.setUint32(pos, data, true);
      pos += 4;
    }
  }
}
