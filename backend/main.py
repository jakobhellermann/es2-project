from flask import Flask, request
import whisper
from llama_cpp import Llama
import tempfile

app = Flask(__name__)

@app.route("/transcribe", methods=["POST"])
def hello_world():
    tmp_file  = tempfile.NamedTemporaryFile()

    try:
        print("writing audio data to temp file:", tmp_file.name)
        with open(tmp_file.name, "wb") as f:
            chunk_size = 4096
            while True:
                chunk = request.stream.read(chunk_size)
                if len(chunk) == 0:
                    break
                f.write(chunk)

        result = model.transcribe(tmp_file.name)

        print("transcription result:", result["text"])

        system_prompt = "Du bist ein hilfreicher Assistent. Bitte halte dich kurz und prägnant."

        prompt = f"{system_prompt} USER: {result["text"]} ASSISTANT: "
        print("prompt:", prompt)

        output = llm(
            prompt,
            max_tokens=100, # Generate up to 32 tokens, set to None to generate up to the end of the context window
            stop=["USER:", "\n"], # Stop generating just before the model would generate a new question
            echo=True # Echo the prompt back in the output
        )

        text = output["choices"][0]["text"]
        text = text[len(prompt):].strip()

        return text
    except Exception as e:
        print(e)
        return "transcription failed", 500

def main():
    global model
    model = whisper.load_model("base")
    print("model 'base' loaded")

    global llm
    llm = Llama(
      model_path="./em_german_leo_mistral.Q4_K_M.gguf",
    )

    app.run(debug=True, host='0.0.0.0', port=8080)

if __name__ == '__main__':
    main()
