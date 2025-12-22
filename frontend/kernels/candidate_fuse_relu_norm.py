import torch


class FusedReluNorm(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.eps = 1e-5

    def forward(self, x):
        y = torch.relu(x)
        mean = y.mean(dim=-1, keepdim=True)
        var = y.var(dim=-1, unbiased=False, keepdim=True)
        return (y - mean) / torch.sqrt(var + self.eps)


def make_module():
    return FusedReluNorm()


def make_baseline():
    # Baseline: relu followed by layer_norm on last dim (set at runtime)
    # We wrap creation in a module so shape can be set when first called.
    class Baseline(torch.nn.Module):
        def forward(self, x):
            ln = torch.nn.LayerNorm(x.shape[-1]).to(x.device, x.dtype)
            return ln(torch.relu(x))

    return Baseline()
