Jeg ønsker å slå sammen noen av design fra konsept design.


Hoveddesign:

1. To-Do-List

Jeg ønsker å bruke nr. 3 Kartet design for det overordnede design, dvs farger, tekst, størrrelse, osv. Jeg liker farge og formate veldig bra.

Tillegg: 

1. For mobile: jeg  liker today-cold open m1 and m8 setting-no API key fra nr. 1 "Due date", m2 capture suggestion pending fra nr. 5 "Tett", m3 review proposed -all three parts and m4 review-edits priority only fra nr. 3 "Kartet", m5 partial with undo live fra nr. 1 "Due date", m6 task detail and m7 smart list fra nr. 5 "Tett" and m9 first run mix from nr. 1 "Due date" and nr. 5 "Tett".

	For desktop: d1 today-cold open, d2 review-all three parts proposed, d7 setting and d8 setting-failure-persistent failure fra nr. 5 "tett", d3 review-editing priority only and d5 task detail in the shell, d6 archive fra nr. 3 "Kartet".  d5 task detail in the shell kan  også vurdere fra nr. 1 "Due date".

---

## Arkitekturfasen 2026-11-18

Avgjort av brukeren under `bmad-architecture` (full begrunnelse i
`../architecture/architecture-To-Do-List-2026-11-18/.memlog.md`):

1. **Grensesnittspråk: engelsk.** Lukker ett av de tre `[OPEN]`-punktene i `PRODUCT.md` og
   `EXPERIENCE.md`. `EXPERIENCE.md` er oppdatert: Settings stiller ikke lenger spørsmålet, og
   punktet under *Open Decisions* er strøket. Ingen endring i rammene — de var allerede engelske.
2. **Model Engine bruker FR-7s fire tagger** (`school`, `group`, `work`, `personal`), samme sett som
   regelmotoren. Lukker det åpne punktet fra 2026-11-14. Ført som PRD §13 rad 18.
3. **Fullført og arkivert er utledet, ikke lagret** — Task lagrer fullføringsdatoen. Ført som PRD §13
   rad 17 og §3. Konsekvens: gjenoppretting av en arkivert Task sletter fullføringsdatoen.

Fortsatt åpent, og ikke designs å avgjøre alene: WCAG 2.2 AA som forpliktet gulv, og om
prioritet/motor-proveniens noen gang kan bæres av farge alene.
