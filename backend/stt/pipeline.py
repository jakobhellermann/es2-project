from stt import STT
from transformers import pipeline
import tempfile


class AutomaticSpeechRecognitionPipeline(STT):
    def __init__(self, model: str):
        self.model = pipeline(
            "automatic-speech-recognition", model,
        )

    def speech_to_text(self, speech: bytes) -> str:
        temp_file = self.__write_request_to_temp_file(speech)

        transcription = self.model(temp_file.name, chunk_length_s=30)
        return transcription["text"].strip()

    def __write_request_to_temp_file(self, audio: bytes):
        tmp_file = tempfile.NamedTemporaryFile()
        tmp_file.write(audio)
        return tmp_file
