from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BENCH = ROOT.parent / 'virtue-bench'
SOURCE = BENCH / 'public' / 'data'
DEST = ROOT / 'public' / 'data'

subprocess.run(['python3', '-m', 'src.export_site_data'], cwd=BENCH, check=True)

if DEST.exists():
    shutil.rmtree(DEST)
shutil.copytree(SOURCE, DEST)
print(f'Synced {SOURCE} -> {DEST}')
