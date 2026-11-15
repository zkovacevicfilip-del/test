# 2D simulace proudění (Lattice Boltzmann, D2Q9, BGK). Vítr zleva, nahoře a dole periodicky.
# Ukládá rychlostní pole po snímcích jako int8 pro vykreslení částic ve videu.
import json, sys, time
import numpy as np

name, outdir = sys.argv[1], sys.argv[2]
import os; os.makedirs(outdir, exist_ok=True)
U = 0.1
CFG = {
    "cyl":   dict(nx=360, ny=207, nu=0.0307, warm=26000, frames=260, stride=60),
    "drop":  dict(nx=360, ny=207, nu=0.0307, warm=14000, frames=40,  stride=60),
    "rider": dict(nx=360, ny=250, nu=0.0300, warm=9000,  frames=330, stride=60),
}[name]
if len(sys.argv) > 3 and sys.argv[3] == "bench":
    CFG.update(warm=300, frames=2)
nx, ny = CFG["nx"], CFG["ny"]
Y, X = np.mgrid[0:ny, 0:nx]

if name == "cyl":
    cx, cy, r = 92.0, ny / 2 + 0.5, 23.0
    mask = (X - cx) ** 2 + (Y - cy) ** 2 < r ** 2
    shape = {"type": "circle", "cx": cx, "cy": cy, "r": r}
elif name == "drop":
    # souměrný profil NACA 0025: stejná šířka (tloušťka 46) jako válec, délka 184
    c, x0, cy = 184.0, 58.0, ny / 2 + 0.5
    xs = np.clip((X - x0) / c, 0, 1)
    yt = 5 * 0.25 * c * (0.2969 * np.sqrt(xs) - 0.1260 * xs - 0.3516 * xs ** 2 + 0.2843 * xs ** 3 - 0.1036 * xs ** 4)
    mask = (X >= x0) & (X <= x0 + c) & (np.abs(Y - cy) < yt)
    shape = {"type": "naca", "x0": x0, "c": c, "cy": cy, "t": 0.25}
else:
    from PIL import Image
    mask = np.array(Image.open(outdir + "/rider-mask.png").convert("L")) > 110
    shape = {"type": "rider", **json.load(open(outdir + "/rider-place.json"))}

cxs = np.array([0, 0, 1, 1, 1, 0, -1, -1, -1])
cys = np.array([0, 1, 1, 0, -1, -1, -1, 0, 1])
w = np.array([4 / 9, 1 / 9, 1 / 36, 1 / 9, 1 / 36, 1 / 9, 1 / 36, 1 / 9, 1 / 36], dtype=np.float32)
opp = [0, 5, 6, 7, 8, 1, 2, 3, 4]
tau = 3 * CFG["nu"] + 0.5
cxf, cyf = cxs.astype(np.float32), cys.astype(np.float32)


def feq(rho, ux, uy):
    cu = ux[..., None] * cxf + uy[..., None] * cyf
    return rho[..., None] * w * (1 + 3 * cu + 4.5 * cu ** 2 - 1.5 * (ux ** 2 + uy ** 2)[..., None])


rng = np.random.default_rng(7)
ux0 = np.full((ny, nx), U, dtype=np.float32)
# malá nesouměrná porucha, aby se vírová stezka rozběhla dřív
uy0 = (0.06 * U * np.sin(2 * np.pi * X / nx * 3) * np.exp(-((Y - ny / 2) / (ny / 3)) ** 2)).astype(np.float32)
uy0 += (0.01 * U * rng.standard_normal((ny, nx))).astype(np.float32)
F = feq(np.ones((ny, nx), dtype=np.float32), ux0, uy0).astype(np.float32)
Fin = feq(np.ones((ny, 1), dtype=np.float32), np.full((ny, 1), U, dtype=np.float32), np.zeros((ny, 1), dtype=np.float32))[:, 0, :].astype(np.float32)

total = CFG["warm"] + CFG["frames"] * CFG["stride"]
fields = np.zeros((CFG["frames"], ny, nx, 2), dtype=np.int8)
Q = 127 / (2.4 * U)
probe = []
t0 = time.time()
for it in range(total):
    for i in range(1, 9):
        F[:, :, i] = np.roll(np.roll(F[:, :, i], cxs[i], axis=1), cys[i], axis=0)
    F[:, -1, :] = F[:, -2, :]          # výtok
    F[:, 0, :] = Fin                   # vtok
    bnd = F[mask][:, opp]              # odraz od tělesa
    rho = F.sum(2)
    ux = (F @ cxf) / rho
    uy = (F @ cyf) / rho
    F += (feq(rho, ux, uy) - F) / tau
    F[mask] = bnd
    if not np.isfinite(rho[ny // 2, nx // 2]):
        print("NESTABILNÍ v kroku", it); sys.exit(1)
    k = it - CFG["warm"]
    if k >= 0 and k % CFG["stride"] == 0:
        ux[mask] = 0; uy[mask] = 0
        f = k // CFG["stride"]
        fields[f, :, :, 0] = np.clip(np.round(ux * Q), -127, 127)
        fields[f, :, :, 1] = np.clip(np.round(uy * Q), -127, 127)
    if it % 200 == 0:
        probe.append(float(uy[ny // 2, min(nx - 20, int(nx * 0.62))]))
    if it % 4000 == 0:
        print(f"{name}: krok {it}/{total}, {time.time()-t0:.0f} s, uy sonda {probe[-1]:+.4f}", flush=True)

# nejlepší délka smyčky (pro periodické odtrhávání vírů)
n = CFG["frames"]
loop = n
if n >= 120:
    a = fields[0].astype(np.int16)
    errs = [(L, float(np.abs(fields[L].astype(np.int16) - a).mean())) for L in range(n // 2, n)]
    loop, err = min(errs, key=lambda e: e[1])
    print(f"{name}: smyčka {loop} snímků, chyba {err:.2f} (medián {np.median([e[1] for e in errs]):.2f})")
fields.tofile(f"{outdir}/{name}.bin")
mask.astype(np.uint8).tofile(f"{outdir}/{name}-mask.bin")
json.dump({"name": name, "nx": nx, "ny": ny, "frames": n, "loop": loop, "U": U, "q": Q, "stride": CFG["stride"], "shape": shape,
           "probe_amp": float(np.std(probe[-40:]))}, open(f"{outdir}/{name}.json", "w"))
print(f"{name}: hotovo za {time.time()-t0:.0f} s, kmitání sondy {np.std(probe[-40:]):.4f}")
