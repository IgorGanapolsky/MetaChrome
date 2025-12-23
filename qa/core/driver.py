import time
import os
from ppadb.client import Client as AdbClient
from PIL import Image
import io

class AdbDriver:
    def __init__(self, serial=None):
        self.client = AdbClient(host="127.0.0.1", port=5037)
        devices = self.client.devices()
        
        if not devices:
            raise RuntimeError("No devices connected via ADB")
        
        if serial:
            self.device = self.client.device(serial)
        else:
            self.device = devices[0]
            
        print(f"[AdbDriver] Connected to {self.device.serial}")

    def launch_app(self, package_name: str):
        print(f"[AdbDriver] Launching {package_name}...")
        # Force stop first to ensure fresh state
        self.device.shell(f"am force-stop {package_name}")
        # Launch main activity
        self.device.shell(f"monkey -p {package_name} -c android.intent.category.LAUNCHER 1")
        time.sleep(3) # Wait for splash screen

    def capture_screenshot(self) -> Image.Image:
        raw = self.device.screencap()
        image = Image.open(io.BytesIO(raw))
        return image

    def tap(self, x: int, y: int):
        self.device.shell(f"input tap {x} {y}")

    def input_text(self, text: str):
        # Escaping spaces for shell
        escaped_text = text.replace(" ", "%s")
        self.device.shell(f"input text {escaped_text}")

    def go_home(self):
        self.device.shell("input keyevent KEYCODE_HOME")
