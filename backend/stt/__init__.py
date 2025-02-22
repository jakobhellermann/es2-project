from abc import ABC, abstractmethod


class STT(ABC):
    @abstractmethod
    def speech_to_text(self, speech: bytes) -> str:
        """Transcribe speech to text."""
        pass
