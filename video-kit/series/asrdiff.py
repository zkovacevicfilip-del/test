# Porovná, co hlas opravdu řekl (přepis), s textem scénáře. Vypíše jen rozdíly.
#   python3 video-kit/series/asrdiff.py <název videa> [další…]
import json, re, sys, difflib, os
KITS = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'work', 'kits')
norm = lambda s: [w for w in re.sub(r"[^A-Z' ]", ' ', s.upper().replace('-', ' ').replace('’', "'")).split() if w != 'AND']
for t in sys.argv[1:]:
    sc = json.load(open(f'{KITS}/{t}/script.json')); words = json.load(open(f'{KITS}/{t}/work/asr/words.json')); out = []
    for k, l in sc['lines'].items():
        a, b = norm(l['say']), norm(' '.join(w[0] for w in words[k]))
        for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b).get_opcodes():
            if op != 'equal': out.append(f"  {k}: text „{' '.join(a[i1:i2])}“ → slyšeno „{' '.join(b[j1:j2])}“")
    print(t + (': přepis sedí' if not out else ':\n' + '\n'.join(out)))
