#!/usr/bin/env python3
"""
Generate fused kernel candidates based on simple templates.
Outputs files into frontend/kernels/generated_*.py
Templates included:
 - fused_relu_norm
 - fused_bias_gelu
 - fused_conv_bn_relu (placeholder using torch.ops where available)
"""
import os
from textwrap import dedent
import glob

ROOT = os.path.dirname(__file__)
KERNEL_DIR = os.path.abspath(os.path.join(ROOT, "..", "kernels"))

DEFAULT_HIDDEN = 1024

TEMPLATES = {
    "fused_bias_gelu": dedent(
        """
        import torch

        class FusedBiasGelu(torch.nn.Module):
            def __init__(self, hidden):
                super().__init__()
                self.bias = torch.nn.Parameter(torch.zeros(hidden))
            def forward(self, x):
                # expects last dimension == hidden
                return torch.nn.functional.gelu(x + self.bias)

        def make_module():
            return FusedBiasGelu(hidden={hidden})

        def make_baseline():
            class Baseline(torch.nn.Module):
                def __init__(self, hidden):
                    super().__init__()
                    self.bias = torch.nn.Parameter(torch.zeros(hidden))
                def forward(self, x):
                    return torch.nn.functional.gelu(x + self.bias)
            return Baseline(hidden={hidden})
        """
    ),
    "fused_relu_norm": dedent(
        """
        import torch

        class FusedReluNorm(torch.nn.Module):
            def __init__(self, eps=1e-5):
                super().__init__()
                self.eps = eps
            def forward(self, x):
                y = torch.relu(x)
                mean = y.mean(dim=-1, keepdim=True)
                var = y.var(dim=-1, unbiased=False, keepdim=True)
                return (y - mean) * torch.rsqrt(var + self.eps)

        def make_module():
            return FusedReluNorm()

        def make_baseline():
            class Baseline(torch.nn.Module):
                def forward(self, x):
                    y = torch.relu(x)
                    return torch.nn.functional.layer_norm(y, (x.shape[-1],))
            return Baseline()
        """
    ),
}


def emit(name, code):
    fname = os.path.join(KERNEL_DIR, f"generated_{name}.py")
    with open(fname, "w", encoding="utf-8") as f:
        f.write(code)
    print(f"Generated {fname}")


def main():
    os.makedirs(KERNEL_DIR, exist_ok=True)
    # Clean old generated kernels
    for old in glob.glob(os.path.join(KERNEL_DIR, "generated_*.py")):
        try:
            os.remove(old)
        except OSError:
            pass
    hidden = DEFAULT_HIDDEN
    for name, tmpl in TEMPLATES.items():
        emit(f"{name}_{hidden}", tmpl.format(hidden=hidden))


if __name__ == "__main__":
    main()
