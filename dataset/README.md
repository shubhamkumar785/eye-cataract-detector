# Dataset Notes

Place cataract eye images in:

- `normal/`
- `mild/`
- `severe/`

If you only have a two-class dataset with `normal/` and `cataract/`, the training script can split the cataract folder into `mild/` and `severe/` using a simple opacity-based OpenCV heuristic before training.

Use eye-image datasets, not the brain tumor MRI dataset sometimes linked by mistake in copied prompts.
