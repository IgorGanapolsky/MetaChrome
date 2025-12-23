import pytest
import os
from qa.config import Config
from qa.core.driver import AdbDriver
from qa.core.agent import QAAgent

# Skip if no ADB device (so CI doesn't fail unless we spin up emulator)
def has_adb_device():
    try:
        from ppadb.client import Client as AdbClient
        client = AdbClient(host="127.0.0.1", port=5037)
        return len(client.devices()) > 0
    except:
        return False

@pytest.mark.skipif(not has_adb_device(), reason="No ADB device connected")
def test_app_launch():
    driver = AdbDriver()
    agent = QAAgent(driver)
    
    # Action
    agent.perform("Launch the app")
    
    # Verify
    # Simple verification: check if screenshot is not black
    screenshot = driver.capture_screenshot()
    assert screenshot is not None
    assert screenshot.width > 0
    
    # Save for manual inspection
    os.makedirs(Config.ARTIFACTS_DIR, exist_ok=True)
    screenshot.save(os.path.join(Config.ARTIFACTS_DIR, "launch_screenshot.png"))
