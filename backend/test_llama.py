import requests
import json

def test_llama3():
    try:
        payload = {
            "model": "llama3:8b",
            "prompt": "Hello, this is a test."
        }
        headers = {"Content-Type": "application/json"}
        
        print("Testing LLaMA3 connection...")
        response = requests.post("http://localhost:11434/api/generate", json=payload, headers=headers, timeout=10)
        
        if response.status_code == 200:
            print("LLaMA3 is responding!")
            # Parse the streaming response
            full_text = ""
            for line in response.iter_lines():
                if line:
                    data = json.loads(line)
                    full_text += data.get("response", "")
            print(f"Response: {full_text}")
        else:
            print(f"LLaMA3 returned status code: {response.status_code}")
            
    except requests.exceptions.Timeout:
        print("LLaMA3 request timed out")
    except Exception as e:
        print(f"LLaMA3 test failed: {e}")

if __name__ == "__main__":
    test_llama3() 