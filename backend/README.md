# Firewall Log Analysis API

FastAPI application with LangGraph workflow for firewall log analysis.

## Prerequisites

- Python >= 3.9
- `uv` (recommended) or `pip` and `venv`

## Installation

### 1. Create a virtual environment

#### With `venv` (standard method):
```bash
python -m venv .venv
```

#### With `uv` (recommended):
```bash
uv venv
```

### 2. Activate the virtual environment

#### On macOS/Linux:
```bash
source .venv/bin/activate
```

#### On Windows:
```bash
.venv\Scripts\activate
```

### 3. Install dependencies

#### With `pip`:
```bash
pip install -e .
```

#### With `uv` (recommended):
```bash
uv sync
```

### 4. Configure environment variables

1. Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```

2. Edit the `.env` file and fill in the environment variables

## Running the server

### Method 1: Direct execution
```bash
python main.py
```

### Method 2: With uvicorn (recommended for development)
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The `--reload` flag enables automatic reloading when code changes are detected.

### Method 3: With uv
```bash
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
