# Vendored subset typefaces

Three faces are vendored here, and nothing else. No CDN, no Google Fonts, no network request at
runtime (AD-11). The two families are the whole typographic system: Barlow Condensed 700 for
apparatus, Archivo 400 and 600 for everything the user wrote or will accept (UX-DR3).

| File | Face | Role |
| --- | --- | --- |
| `archivo-400.woff2` | Archivo Regular (wght 400, wdth 100) | body prose, field values |
| `archivo-600.woff2` | Archivo SemiBold (wght 600, wdth 100) | the first run display line |
| `barlow-condensed-700.woff2` | Barlow Condensed Bold (700) | all apparatus, uppercase, tracked |

## Source revision

Sources are the upstream Google Fonts release, taken at one pinned commit so the subset is
reproducible:

- repository: `https://github.com/google/fonts`
- commit: `b46ed7e334ae7aaf3c6b9c446e087d57de39ff7d`
- files:
  - `ofl/archivo/Archivo[wdth,wght].ttf` — variable, axes `wdth` and `wght`
  - `ofl/barlowcondensed/BarlowCondensed-Bold.ttf` — static
  - `ofl/archivo/OFL.txt`, `ofl/barlowcondensed/OFL.txt` — both copyright lines are carried in
    `OFL.txt` here; the licence body below line 1 is byte-identical between them

Tooling: `fonttools[woff]` 4.62.0 on Python 3.13 (`brotli` comes with the `woff` extra and is what
writes `woff2`). Nothing in `npm ci` depends on any of this — the subsets are committed artefacts,
which is why the commands are recorded here instead of being wired into a repository script.

## Exact invocation

Archivo ships only as a variable font upstream, so each weight is first instanced to a static face,
then subset. `wdth=100` pins the normal width; `Archivo-Italic` is not vendored because no surface
uses italics.

```sh
UNICODES='U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'

fonttools varLib.instancer 'Archivo[wdth,wght].ttf' wght=400 wdth=100 -o Archivo-Regular.ttf
fonttools varLib.instancer 'Archivo[wdth,wght].ttf' wght=600 wdth=100 -o Archivo-SemiBold.ttf

pyftsubset Archivo-Regular.ttf          --unicodes="$UNICODES" --layout-features+=tnum --flavor=woff2 --output-file=archivo-400.woff2
pyftsubset Archivo-SemiBold.ttf         --unicodes="$UNICODES" --layout-features+=tnum --flavor=woff2 --output-file=archivo-600.woff2
pyftsubset BarlowCondensed-Bold.ttf     --unicodes="$UNICODES" --layout-features+=tnum --flavor=woff2 --output-file=barlow-condensed-700.woff2
```

On a machine where the `pyftsubset` and `fonttools` console scripts cannot be executed directly —
Windows with an Application Control policy, which is this project's machine — the same two entry
points are reachable as modules, and these are the commands that actually produced the committed
files:

```sh
uvx --from 'fonttools[woff]==4.62.0' python -m fontTools.varLib.instancer ...
uvx --from 'fonttools[woff]==4.62.0' python -m fontTools.subset ...
```

### Two things about that command line are load-bearing

**`--layout-features+=tnum`, with the `+=`.** fontTools treats `--layout-features` as a list option:
`+=` appends to the subsetter's default feature set, while a plain `=` *replaces* it. AD-11 spells
this as `--layout-features=+tnum`, which fontTools 4.62.0 reads as a one-element list holding the
literal string `+tnum`. That matches no feature tag, so the subsetter drops **every** layout feature
— `tnum` included — and writes a font with an empty `GSUB` FeatureList without warning. The spelling
is the defect, not the intent; `tests/unit/fonts-tnum.test.ts` is what makes the distinction visible,
because it reads the committed file rather than the command.

**The Latin range includes `U+00E5`, `U+00E6`, `U+00F8` and their capitals.** A Norwegian user types
`æ`, `ø` and `å` into their own sentences. A subset without them renders those words in a fallback
face, which splits one sentence across two typefaces and breaks the semantic type split outright.
`U+00B7` (the middle dot used in apparatus lines) and the `U+2000-206F` punctuation block are in the
range for the same reason.

## Proof

`tnum` survives in all three files, verified in the committed `woff2` and not in a computed style —
`font-variant-numeric: tabular-nums` computes as set even when the font no longer carries the
feature, so CSS cannot witness its own failure here (AD-11):

| File | GSUB features kept |
| --- | --- |
| `archivo-400.woff2` | `ccmp dnom frac liga locl numr tnum` |
| `archivo-600.woff2` | `ccmp dnom frac liga locl numr rvrn tnum` |
| `barlow-condensed-700.woff2` | `ccmp dnom frac liga locl numr tnum` |

`tests/unit/fonts-tnum.test.ts` re-derives that table on every `npm test`: it decompresses each
`woff2`, walks to the `GSUB` table and asserts `tnum` is in its FeatureList.

## Licence

Both families are under the SIL Open Font License 1.1, reproduced in full in `OFL.txt` beside these
files. Subsetting and instancing are modifications the licence permits; the reserved font names are
unchanged, so the subsets are not renamed.
