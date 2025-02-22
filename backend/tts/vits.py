from transformers import VitsModel, AutoTokenizer
import torch
import scipy
import uuid
from tts import TTS


class VitsTTS(TTS):
    def __init__(self, model: str):
        self.tts_model = VitsModel.from_pretrained(model)
        self.tts_tokenizer = AutoTokenizer.from_pretrained(model)

    def text_to_speech(self, text: str):
        inputs = self.tts_tokenizer(text, return_tensors="pt")
        with torch.no_grad():
            output = self.tts_model(**inputs).waveform
            output = output.cpu().float().numpy().transpose()

            return self.__write_audio_to_disk(output)

    def __write_audio_to_disk(self, audio):
        id = uuid.uuid4()
        out_file = f"data/{id}.wav"
        scipy.io.wavfile.write(
            out_file, rate=self.tts_model.config.sampling_rate, data=audio
        )

        return f"{id}.wav"
