import requests
import json
try:
    res = requests.get("https://ai-alphacore-tech--fannin-crime-fastapi-app.modal.run/api/mugshots", timeout=30)
    print(json.dumps(res.json(), indent=2))
except Exception as e:
    print(e)
