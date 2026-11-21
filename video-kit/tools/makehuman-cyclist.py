# Převod modelu člověka MakeHuman (CC0) na jezdce pro formát „ride“: tělo muže (cílové tvary), kostra a váhy kostí,
# oblasti oblečení podle kostí (kombinéza, kraťasy, kůže, boty). Výstup: engine/models/cyclist.json + cyclist.bin.
#   python3 makehuman-cyclist.py <složka se staženými soubory MakeHuman> <výstupní složka>
# Zdroj: github.com/makehumancommunity/makehuman (makehuman/data): 3dobjs/base.obj, rigs/default.mhskel,
# rigs/default_weights.mhw, targets/macrodetails/*.target. Data (assets) jsou CC0 1.0 (LICENSE.ASSETS.md).
import json, os, sys
import numpy as np

SRC, OUT = sys.argv[1], sys.argv[2]
# tělo: muž (bělošský, mladý) a štíhlý svalnatý cyklista (napůl k „max svaly, min. váha“)
TARGETS = [("caucasian-male-young.target", 1.0), ("universal-male-young-maxmuscle-minweight.target", 0.55)]

V, faces, group = [], [], None
for line in open(os.path.join(SRC, "base.obj")):
    if line.startswith("v "): V.append([float(x) for x in line.split()[1:4]])
    elif line.startswith("g "): group = line.split()[1]
    elif line.startswith("f ") and group == "body": faces.append([int(p.split("/")[0]) - 1 for p in line.split()[1:]])
V = np.array(V, dtype=np.float64)
for name, w in TARGETS:
    for line in open(os.path.join(SRC, name)):
        if line.startswith("#") or not line.strip(): continue
        i, dx, dy, dz = line.split(); V[int(i)] += w * np.array([float(dx), float(dy), float(dz)])

sk = json.load(open(os.path.join(SRC, "default.mhskel")))
joint = {k: V[v].mean(axis=0) for k, v in sk["joints"].items()}
names = []
def add(n):   # rodiče před dětmi
    if n in names: return
    p = sk["bones"][n]["parent"]
    if p: add(p)
    names.append(n)
for n in sorted(sk["bones"]): add(n)
idx = {n: i for i, n in enumerate(names)}
bones = [{"name": n, "parent": idx[sk["bones"][n]["parent"]] if sk["bones"][n]["parent"] else -1,
          "head": [round(x, 5) for x in joint[sk["bones"][n]["head"]]], "tail": [round(x, 5) for x in joint[sk["bones"][n]["tail"]]]} for n in names]

# váhy: nejvýš 4 kosti na bod, součet 1
W = json.load(open(os.path.join(SRC, "default_weights.mhw")))["weights"]
per = {}
for b, lst in W.items():
    for v, w in lst: per.setdefault(v, []).append((w, idx[b]))
used = sorted({v for f in faces for v in f}); remap = {v: i for i, v in enumerate(used)}; n = len(used)
pos = V[used].astype(np.float32)
si = np.zeros((n, 4), np.uint8); sw = np.zeros((n, 4), np.float32); top = np.zeros(n, np.int32)
for i, v in enumerate(used):
    l = sorted(per.get(v, [(1.0, idx["root"])]), reverse=True)[:4]; s = sum(w for w, _ in l)
    for k, (w, b) in enumerate(l): si[i, k] = b; sw[i, k] = w / s
    top[i] = l[0][1]

# oblečení podle vah kostí (plynulý přechod, ne zubatý okraj): podíl kombinézy, kraťasů, ramen a chodidel v každém bodě
def region(b):
    if b in ("root", "spine05") or b.startswith(("pelvis", "upperleg")): return 2
    if b.startswith("shoulder01"): return 3
    if b.startswith(("spine", "clavicle", "breast", "upperarm")): return 1
    if b.startswith(("foot", "toe")): return 4
    return 0
cloth = np.zeros((n, 4), np.float32)   # kombinéza, kraťasy, ramena, chodidla
for i in range(n):
    for k in range(4):
        r = region(names[si[i, k]])
        if r: cloth[i, r - 1] += sw[i, k]
cloth = np.round(np.clip(cloth, 0, 1) * 255).astype(np.uint8)
tris = []
for f in faces:
    f = [remap[v] for v in f]
    for k in range(1, len(f) - 1): tris.append((f[0], f[k], f[k + 1]))
tris = np.array(tris, np.uint32)
os.makedirs(OUT, exist_ok=True)
blob = pos.tobytes() + si.tobytes() + sw.tobytes() + cloth.tobytes() + tris.astype(np.uint16 if n < 65536 else np.uint32).tobytes()
open(os.path.join(OUT, "cyclist.bin"), "wb").write(blob)
ys = pos[:, 1]
meta = {"source": "MakeHuman base mesh, default rig a váhy (CC0 1.0), cílové tvary: " + ", ".join(f"{a} {b}" for a, b in TARGETS),
        "units": "dm, osa y nahoru, postava hledí k +z, levá strana (.L) na +x", "vertices": n, "triangles": len(tris), "index16": n < 65536,
        "height": round(float(ys.max() - ys.min()), 4), "cloth": ["kombinéza", "kraťasy", "ramena", "chodidla"], "bones": bones}
json.dump(meta, open(os.path.join(OUT, "cyclist.json"), "w"), ensure_ascii=False, separators=(",", ":"))
print(f"body {n}, trojúhelníky {len(tris)}, kosti {len(bones)}, výška {meta['height']:.2f} dm, soubor {len(blob) / 1e6:.2f} MB")
J = lambda b: joint[sk["bones"][b]["head"]]
print("levé rameno x:", round(J("upperarm01.L")[0], 2), " kyčel–rameno dm:", round(float(np.linalg.norm(J("upperarm01.R") - (J("upperleg01.R") + J("upperleg01.L")) / 2)), 2),
      " paže:", round(float(np.linalg.norm(J("lowerarm01.R") - J("upperarm01.R"))), 2), round(float(np.linalg.norm(J("wrist.R") - J("lowerarm01.R"))), 2),
      " noha:", round(float(np.linalg.norm(J("lowerleg01.R") - J("upperleg01.R"))), 2), round(float(np.linalg.norm(J("foot.R") - J("lowerleg01.R"))), 2), " hlava:", [round(x, 2) for x in J("head")])
