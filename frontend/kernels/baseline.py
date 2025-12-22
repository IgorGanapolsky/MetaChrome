import torch


def make_module():
  # Identity baseline; produces same output as input.
  return torch.nn.Identity()
