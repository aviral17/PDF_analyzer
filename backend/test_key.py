import os
import requests

API_KEY = "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"

response = requests.post(
    "https://openrouter.ai/api/v1/chat/completions",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "TEST"
    },
    json={
        "model": "deepseek/deepseek-chat-v3-0324:free",
        "messages": [{"role": "user", "content": "Say 'API WORKS' if this works"}]
    }
)

print("Status Code:", response.status_code)
print("Response:", response.json())