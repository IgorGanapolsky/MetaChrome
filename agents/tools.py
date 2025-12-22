import subprocess
from typing import Any, Dict


def _run(cmd: str) -> Dict[str, Any]:
    try:
        out = subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT, text=True)
        return {"status": "ok", "output": out.strip()}
    except subprocess.CalledProcessError as e:
        return {"status": "error", "code": e.returncode, "output": e.output}


def kernel_gen():
    return _run("cd frontend && yarn kernel:gen")


def kernel_bench():
    return _run("cd frontend && yarn kernel:bench")


def kernel_select():
    return _run("cd frontend && yarn kernel:select")


def rag_build():
    return _run("cd frontend && yarn rag:build")


def rag_publish():
    return _run("cd frontend && VERTEX_API_KEY=skip GCP_PROJECT_ID=claude-code-learning yarn rag:publish")


def eval_monitorability():
    return _run("cd frontend && yarn eval:monitorability")


def lessons_query(prompt: str):
    return _run(f'cd frontend && node scripts/agent-dev.js "{prompt}"')
