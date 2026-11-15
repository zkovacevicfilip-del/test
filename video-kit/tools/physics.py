# Čísla do scénáře se počítají, nevymýšlejí. Stejný model jako kalkulačka v aplikaci (aero.js):
# výkon na kole = 0,5 · ρ · CdA · v³ + Crr · m · g · v, děleno účinností převodů.
#   python3 video-kit/tools/physics.py <watty> <CdA horší> <CdA lepší> [km=40] [kg=84]
# Příklad z videa „What is CdA“: python3 video-kit/tools/physics.py 250 0.30 0.25
import sys

G, CRR, EFF, TEMP, ALT = 9.80665, 0.004, 0.975, 20.0, 0.0
RHO = 101325 * (1 - 2.25577e-5 * ALT) ** 5.25588 / (287.058 * (TEMP + 273.15))


def wheel(v, cda, m): return 0.5 * RHO * cda * v ** 3 + CRR * m * G * v


def speed(watts, cda, m):
    lo, hi = 0.05, 40.0
    for _ in range(80):
        mid = (lo + hi) / 2
        lo, hi = (lo, mid) if wheel(mid, cda, m) > watts * EFF else (mid, hi)
    return (lo + hi) / 2


if len(sys.argv) < 4: sys.exit(__doc__ or "použití: physics.py <watty> <CdA horší> <CdA lepší> [km=40] [kg=84]")
W, A, B = float(sys.argv[1]), float(sys.argv[2]), float(sys.argv[3])
KM = float(sys.argv[4]) if len(sys.argv) > 4 else 40.0
M = float(sys.argv[5]) if len(sys.argv) > 5 else 84.0
va, vb = speed(W, A, M), speed(W, B, M)
ta, tb = KM * 1000 / va, KM * 1000 / vb
print(f"předpoklady: {M:.0f} kg s kolem, Crr {CRR}, účinnost {EFF*100:.1f} %, {TEMP:.0f} °C, {ALT:.0f} m n. m., hustota vzduchu {RHO:.3f} kg/m³, rovina, bezvětří")
print(f"{W:.0f} W, CdA {A:.3f}: {va*3.6:.1f} km/h, {KM:.0f} km za {int(ta//60)}:{int(ta%60):02d}")
print(f"{W:.0f} W, CdA {B:.3f}: {vb*3.6:.1f} km/h, {KM:.0f} km za {int(tb//60)}:{int(tb%60):02d}")
print(f"rozdíl: {(vb-va)*3.6:.1f} km/h, {(ta-tb)/60:.1f} min na {KM:.0f} km")
for v_kmh in (30, 35, 40, 45, 50):
    v = v_kmh / 3.6; aero = 0.5 * RHO * B * v ** 3; roll = CRR * M * G * v
    print(f"při {v_kmh} km/h (CdA {B:.3f}): vzduch {100*aero/(aero+roll):.0f} % odporu, celkem {(aero+roll)/EFF:.0f} W, 0,01 m² CdA = {0.5*RHO*0.01*v**3/EFF:.1f} W")
