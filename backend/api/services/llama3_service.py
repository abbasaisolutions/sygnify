import requests
import json

def query_llama3(prompt, model="llama3:8b", endpoint="http://localhost:11434/api/generate", timeout=30):
    payload = {
        "model": model,
        "prompt": prompt
    }
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(endpoint, json=payload, stream=True, headers=headers, timeout=timeout)
        response.raise_for_status()

        # Ollama returns NDJSON — collect all chunks
        full_text = ""
        for line in response.iter_lines():
            if line:
                data = json.loads(line)
                full_text += data.get("response", "")

        return full_text.strip()

    except requests.exceptions.Timeout:
        print(f"LLaMA 3 request timed out after {timeout} seconds")
        return "Analysis timed out. Please try again with a smaller dataset or check LLaMA3 service status."
    except Exception as e:
        print(f"LLaMA 3 request failed: {e}")
        return f"LLaMA 3 analysis failed: {str(e)}. Using fallback analysis." 