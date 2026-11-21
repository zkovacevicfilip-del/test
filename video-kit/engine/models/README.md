# Model jezdce (formát „ride“)

`cyclist.json` a `cyclist.bin` vyrobil `video-kit/tools/makehuman-cyclist.py` z dat projektu MakeHuman
(github.com/makehumancommunity/makehuman, složka `makehuman/data`): základní síť `3dobjs/base.obj`,
kostra `rigs/default.mhskel`, váhy `rigs/default_weights.mhw` a cílové tvary `targets/macrodetails/*.target`.
Tato data (assets) jsou podle MakeHuman uvolněná jako CC0 1.0 (viz `LICENSE-makehuman-CC0.md`), smí se volně
používat i upravovat. Program MakeHuman (AGPL) se nepoužívá ani nekopíruje.

Znovu vyrobit: stáhnout zmíněné soubory do `video-kit/work/makehuman/` a spustit
`python3 video-kit/tools/makehuman-cyclist.py video-kit/work/makehuman video-kit/engine/models`.
