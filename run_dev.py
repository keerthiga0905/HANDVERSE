"""HANDVERSE - Multi-Service Local Development Orchestrator.

Starts both the FastAPI backend (http://localhost:8000) and the
Vite React frontend (http://localhost:5173) concurrently with unified logging
and graceful termination.
"""

import os
import signal
import subprocess
import sys
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "frontend"
VENV_PYTHON = ROOT_DIR / ".venv" / "Scripts" / "python.exe"

if not VENV_PYTHON.exists():
    VENV_PYTHON = Path(sys.executable)

processes = []


def terminate_all(signum=None, frame=None):
    """Gracefully terminate child server processes."""
    print("\n[ORCHESTRATOR] Shutting down HANDVERSE development servers...")
    for proc in processes:
        if proc.poll() is None:
            try:
                proc.terminate()
            except Exception:
                pass
    time.sleep(1)
    for proc in processes:
        if proc.poll() is None:
            try:
                proc.kill()
            except Exception:
                pass
    print("[ORCHESTRATOR] All servers terminated cleanly.")
    sys.exit(0)


def main():
    signal.signal(signal.SIGINT, terminate_all)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, terminate_all)

    print("=" * 70)
    print("   🎮 HANDVERSE ARCADE - LOCAL DEVELOPMENT ORCHESTRATOR")
    print("=" * 70)
    print("Starting FastAPI Backend on  : http://localhost:8000")
    print("Swagger API Documentation on : http://localhost:8000/docs")
    print("Starting React Frontend on   : http://localhost:5173")
    print("-" * 70)

    # 1. Start FastAPI Backend
    backend_cmd = [
        str(VENV_PYTHON),
        "-m",
        "uvicorn",
        "main:app",
        "--host",
        "0.0.0.0",
        "--port",
        "8000",
        "--reload",
    ]
    backend_env = os.environ.copy()
    backend_env["PYTHONPATH"] = str(ROOT_DIR / "backend")

    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=str(ROOT_DIR / "backend"),
        env=backend_env,
    )
    processes.append(backend_proc)

    # 2. Start Vite Frontend
    is_windows = sys.platform.startswith("win")
    npm_cmd = "npm.cmd" if is_windows else "npm"

    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=str(FRONTEND_DIR),
        shell=is_windows,
    )
    processes.append(frontend_proc)

    print("\n[ORCHESTRATOR] Both development servers launched successfully.")
    print("[ORCHESTRATOR] Press Ctrl+C in this console to stop both servers.\n")

    try:
        while True:
            time.sleep(0.5)
            # Check if any process exited unexpectedly
            for proc in processes:
                if proc.poll() is not None:
                    print(f"[ORCHESTRATOR] Process {proc.pid} terminated with code {proc.returncode}.")
                    terminate_all()
    except KeyboardInterrupt:
        terminate_all()


if __name__ == "__main__":
    main()
