
import asyncio
import json
import websockets


async def main():
    uri = "ws://127.0.0.1:8001/ws/inventory"

    async with websockets.connect(uri) as ws:
        print("Connected to inventory WebSocket")

        while True:
            message = await ws.recv()
            print(json.dumps(json.loads(message), indent=2))


asyncio.run(main())
