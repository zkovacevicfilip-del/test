# Hladký tvar při skutečných rychlostech: proudění zůstává přilehlé a úplav je tenký.
# LBM při nízkém Re to neukáže (tlustý laminární úplav), proto potenciální proudění + úzký úplav.
import json, sys
import numpy as np
out = sys.argv[1]; nx, ny, U = 360, 207, 0.1
Y, X = np.mgrid[0:ny, 0:nx].astype(np.float64)
c, x0, cy = 184.0, 58.0, ny / 2 + 0.5
xs = np.clip((X - x0) / c, 0, 1)
yt = 5 * 0.25 * c * (0.2969 * np.sqrt(xs) - 0.1260 * xs - 0.3516 * xs ** 2 + 0.2843 * xs ** 3 - 0.1036 * xs ** 4)
mask = (X >= x0) & (X <= x0 + c) & (np.abs(Y - cy) < yt)
far = U * (Y - cy)
psi = far.copy(); psi[mask] = 0
edge = np.zeros_like(mask); edge[0, :] = edge[-1, :] = edge[:, 0] = edge[:, -1] = True
fixed = mask | edge
w = 1.9  # SOR, červeno-černé pořadí
red = ((X + Y) % 2 == 0) & ~fixed; black = ((X + Y) % 2 == 1) & ~fixed
for it in range(6000):
    for sel in (red, black):
        avg = 0.25 * (np.roll(psi, 1, 0) + np.roll(psi, -1, 0) + np.roll(psi, 1, 1) + np.roll(psi, -1, 1))
        psi[sel] += w * (avg[sel] - psi[sel])
ux = np.gradient(psi, axis=0); uy = -np.gradient(psi, axis=1)
# tenký úplav za odtokovou hranou a tenká pomalá vrstva těsně u povrchu
xte = x0 + c; dx = np.clip(X - xte, 0, None)
sig = 2.6 + 0.022 * dx
deficit = np.where(X > xte, 0.72 * np.exp(-dx / 170) * np.exp(-((Y - cy) / sig) ** 2), 0)
ux *= 1 - deficit; uy *= 1 - deficit
ux[mask] = 0; uy[mask] = 0
print("rychlost: max", round(float(np.hypot(ux, uy).max() / U), 2), "U, v úplavu min", round(float(ux[int(cy), int(xte) + 12] / U), 2), "U")
Q = 127 / (2.4 * U)
f = np.zeros((1, ny, nx, 2), dtype=np.int8)
f[0, :, :, 0] = np.clip(np.round(ux * Q), -127, 127); f[0, :, :, 1] = np.clip(np.round(uy * Q), -127, 127)
f.tofile(out + "/drop.bin"); mask.astype(np.uint8).tofile(out + "/drop-mask.bin")
json.dump({"name": "drop", "nx": nx, "ny": ny, "frames": 1, "loop": 1, "U": U, "q": Q, "stride": 60, "model": "potential+thin wake",
           "shape": {"type": "naca", "x0": x0, "c": c, "cy": cy, "t": 0.25}}, open(out + "/drop.json", "w"))
