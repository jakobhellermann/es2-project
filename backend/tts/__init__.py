from abc import ABC, abstractmethod


class TTS(ABC):
    @abstractmethod
    def text_to_speech(self, text: str) -> str:
        """Synthesize text to speech. Returns the path to the generated wav file."""
        pass
