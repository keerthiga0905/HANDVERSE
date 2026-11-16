# HANDVERSE - Motion Arcade

HANDVERSE is a modern, professional hand-motion-controlled gaming arcade powered by computer vision, real-time hand tracking, and interactive game mechanics. Players interact with arcade titles using physical gestures and movements detected via standard webcam hardware, without requiring physical controllers, keyboards, or mice.

---

## 1. Technology Stack

- **Runtime Environment:** Python 3.12 (Windows 11 compatible)
- **Computer Vision:** OpenCV (`opencv-python`)
- **Perception Pipeline:** Google MediaPipe (`mediapipe`)
- **Game Engine & Rendering:** Pygame (`pygame`)
- **Numerical Processing:** NumPy (`numpy`)
- **Persistent Storage:** SQLite (`sqlite3`)
- **Testing Framework:** Pytest (`pytest`)

---

## 2. Project Structure

```text
HANDVERSE/
│
├── main.py                     # Application entry point and runtime loop
├── config.py                   # Centralized configuration dataclasses and constants
├── requirements.txt            # Dependency manifest (Python 3.12 / Windows 11)
├── README.md                   # System documentation and setup guide
├── .gitignore                  # VCS exclusion rules
│
├── core/                       # Core engine services
│   ├── __init__.py
│   ├── camera.py               # Video capture hardware interface
│   ├── hand_tracking.py        # MediaPipe landmark extraction
│   ├── gesture_recognition.py  # Gesture classification state machine
│   ├── gesture_smoothing.py    # Coordinate jitter filters (EMA / 1-Euro)
│   ├── calibration.py          # Coordinate space screen-mapping
│   ├── game_manager.py         # Arcade state machine and game orchestration
│   └── audio_manager.py        # Sound effects and music mixer wrapper
│
├── games/                      # Individual arcade game implementations
│   └── __init__.py
│
├── ui/                         # UI components, HUD overlays, and widgets
│   └── __init__.py
│
├── data/                       # Storage and persistence layer
│   ├── __init__.py
│   └── database.py             # SQLite database manager and schema
│
├── assets/                     # Static game assets
│   ├── images/                 # Sprites, textures, and UI graphics
│   ├── sounds/                 # Sound effects and audio tracks
│   └── fonts/                  # Custom arcade typography
│
├── tests/                      # Automated unit and integration test suite
│   ├── __init__.py
│   └── test_foundation.py      # Module 01 validation tests
│
└── utils/                      # Shared helper utilities and math routines
    └── __init__.py
```

---

## 3. Installation Instructions

### Prerequisites
- Operating System: Windows 11 (64-bit) / macOS / Linux
- Python: Version 3.12.x
- Git (optional, for version control)
- Functional USB or integrated webcam

---

## 4. Virtual Environment Setup

Isolate project dependencies by setting up a dedicated virtual environment.

### Windows (PowerShell):
```powershell
# Navigate to the project root directory
cd "c:\Users\KEERTHIGA M\Desktop\hand gester"

# Create a Python 3.12 virtual environment
python -m venv .venv

# Activate the virtual environment
.\.venv\Scripts\Activate.ps1
```

*(If script execution is disabled in PowerShell, enable it for the current process: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`)*

### Windows (Command Prompt):
```cmd
python -m venv .venv
.\.venv\Scripts\activate.bat
```

---

## 5. Dependency Installation

With the virtual environment activated, install the specified dependencies:

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

---

## 6. Application Launch Command

Launch the HANDVERSE foundation application:

```powershell
python main.py
```

Upon launch:
- The Pygame display window will open with a resolution of 1280x720 at 60 FPS.
- The foundational welcome screen will be displayed with active status diagnostics.
- Press **`ESC`** or **`q`** or click the window's close button to exit cleanly.

---

## 7. Running Tests

Run the test suite to verify foundation integrity:

```powershell
pytest
```

---

## 8. Troubleshooting

### Issue: "Execution of scripts is disabled on this system"
**Resolution:** When activating the virtual environment in PowerShell, run:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

### Issue: `ModuleNotFoundError: No module named 'pygame'` or `cv2`
**Resolution:** Ensure that the virtual environment is activated before running `python main.py`, or invoke using the virtual environment's Python executable directly:
```powershell
.\.venv\Scripts\python.exe main.py
```

### Issue: OpenCV / MediaPipe installation errors on Python 3.12
**Resolution:** Ensure pip is upgraded to the latest version (`python -m pip install --upgrade pip`). If installing in an environment with NumPy 2.x, downgrade or constrain NumPy to `<2.0.0` as specified in `requirements.txt` (`pip install "numpy<2.0.0"`).

### Issue: Pygame audio mixer initialization fails (Headless/No Audio Device)
**Resolution:** If launching on a machine without connected audio output devices, `AudioManager` handles this gracefully and will disable audio output without crashing.
