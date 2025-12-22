#!/usr/bin/env python3
"""
Lightweight kernel benchmark/verification harness.

- Expects a candidate module file that defines make_module() -> torch.nn.Module.
  Optionally also defines make_baseline() to override the default identity baseline.
- Runs correctness check vs baseline (cpu by default, cuda if available).
- Times forward pass with warmup + multiple runs.
- Emits a single-line JSON result to stdout.
"""

import argparse
import importlib.util
import json
import os
import sys
import time


def load_module(path):
    spec = importlib.util.spec_from_file_location("candidate", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--candidate", required=True, help="Path to candidate .py file")
    parser.add_argument("--device", default="cuda" if torch_available_cuda() else "cpu")
    parser.add_argument("--dtype", default="float32")
    parser.add_argument("--repeats", type=int, default=30)
    parser.add_argument("--warmup", type=int, default=5)
    parser.add_argument("--size", default="8,1024", help="comma-separated dimensions, e.g., 8,1024")
    args = parser.parse_args()

    if not torch_available():
        print(json.dumps({"status": "error", "reason": "torch_not_installed"}))
        sys.exit(0)

    import torch

    dims = [int(x) for x in args.size.split(",")]
    device = args.device if torch.cuda.is_available() and args.device == "cuda" else "cpu"
    dtype = getattr(torch, args.dtype)

    mod = load_module(os.path.abspath(args.candidate))
    candidate = mod.make_module().to(device=device, dtype=dtype)
    baseline = (
        mod.make_baseline().to(device=device, dtype=dtype)
        if hasattr(mod, "make_baseline")
        else torch.nn.Identity().to(device=device, dtype=dtype)
    )

    x = torch.randn(*dims, device=device, dtype=dtype, requires_grad=False)

    def run(m):
        with torch.no_grad():
            return m(x)

    def time_module(m):
        # warmup
        for _ in range(args.warmup):
            run(m)
        if device == "cuda":
            torch.cuda.synchronize()
        t0 = time.perf_counter()
        for _ in range(args.repeats):
            run(m)
        if device == "cuda":
            torch.cuda.synchronize()
        return (time.perf_counter() - t0) / args.repeats

    with torch.no_grad():
        out_base = run(baseline)
        out_cand = run(candidate)
        correct = torch.allclose(out_base, out_cand, atol=1e-4, rtol=1e-4)

    t_base = time_module(baseline)
    t_cand = time_module(candidate)
    speedup = t_base / t_cand if t_cand > 0 else None

    result = {
        "status": "ok" if correct else "mismatch",
        "device": device,
        "dtype": args.dtype,
        "size": dims,
        "candidate": os.path.basename(args.candidate),
        "baseline_ms": t_base * 1e3,
        "candidate_ms": t_cand * 1e3,
        "speedup": speedup,
    }
    print(json.dumps(result))


def torch_available():
    try:
        import torch  # noqa
        return True
    except Exception:
        return False


def torch_available_cuda():
    try:
        import torch
        return torch.cuda.is_available()
    except Exception:
        return False


if __name__ == "__main__":
    main()
