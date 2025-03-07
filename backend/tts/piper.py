import os
import uuid
import subprocess
from tts import TTS


class PiperTTS(TTS):
    def __init__(self, model: str, config: str):
        self.__model = model
        self.__config = config
        pass

    def text_to_speech(self, text: str) -> str:
        "Synthesize text to speech using a specific model with piper. Returns the path to the generated wav file."

        id = uuid.uuid4()
        out_file = f"data/{id}.wav"

        args = [
            os.environ.get("PIPER_TTS_BIN", "piper-tts"),
            "--model",
            self.__model,
            "--config",
            self.__config,
            "--output_file",
            out_file,
        ]

        output = subprocess.run(args, input=text.encode("utf-8"), capture_output=True)

        if output.returncode != 0:
            if output.stderr:
                raise Exception(
                    "Command failed with return code "
                    + str(output.returncode)
                    + " and error message: "
                    + output.stderr.decode("utf-8")
                )

            raise Exception("Command failed with return code " + str(output.returncode))

        return f"{id}.wav"
