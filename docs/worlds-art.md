# BrainBox Worlds — art prompt pack (Gemini)

Every picture for the worlds, made with Gemini's image generation. Work through it in order: the **style anchor** comes first, and every later prompt is sent **with the anchor image attached** so the whole set looks like one game.

Hand the finished files over (any folder is fine). They get resized, compressed to WebP and wired into the app; the worlds already work without them, drawn in code, so nothing is blocked while you make these.

## Rules for every image

- **No text.** Gemini likes to add words and numbers. Every prompt below ends with "no text, no letters, no numbers"; if one sneaks in anyway, regenerate or ask Gemini to "remove all text".
- **No real people or photos.** Never upload a photo of a child (or anyone) as a reference. Characters are invented.
- **Plain background** for islands, mascots, bosses and avatars: ask for a flat white background. Gemini can't reliably make a transparent PNG, so remove the background afterwards (remove.bg, Canva's background remover, or leave it and it gets done when the files are wired in).
- **Same style every time:** attach the anchor image and start each prompt with *"Same art style as the attached image."*
- Download the largest size Gemini offers. Name files exactly as listed so they drop straight in.

## 1. Style anchor (make this first)

`island-math.png` — square

> A floating tropical island for a children's learning game, seen from a slightly high three-quarter angle. Soft 3D cartoon style like a premium mobile game: chunky rounded shapes, clay-like smooth surfaces, bright saturated colours, soft studio lighting, gentle shadows. The island is a small friendly volcano in warm orange and red rock with glowing yellow crystals poking out of the slopes, a little sandy beach, two palm trees, and a ring of light-blue water around the base. Cheerful, not scary. Centered, whole island visible, flat white background. No text, no letters, no numbers.

Regenerate until you love it. This image decides the look of everything else, so it's worth 10 tries.

## 2. The other islands (square, attach the anchor)

Start each with: *"Same art style, angle, size and lighting as the attached island. Centered, flat white background. No text, no letters, no numbers."*

| File | Prompt (after the line above) |
|---|---|
| `island-words.png` | A forest island with giant round green trees whose leaves curl like pages, mushrooms, a small wooden treehouse and floating paper scrolls. Greens and leaf yellows. |
| `island-science.png` | A floating space-station island in purple and lilac: a small domed lab, a satellite dish, a test-tube shaped tower with bubbling liquid, tiny orbiting planets around it, set in a dark navy sky patch instead of water. |
| `island-globe.png` | An island inspired by Nigerian landscapes in teal and sandy brown: a big smooth granite rock dome like Zuma Rock, a small colourful market stall with umbrellas, baobab tree, a river winding through. |
| `island-book.png` | Gentle golden hills island in warm yellows: a calm lantern-lit library on the top hill, stacks of giant books forming steps, soft clouds. Peaceful and kind. Not tied to any one religion. |
| `island-art.png` | A coastal island in pinks and corals: paint-splash rocks, a giant paintbrush planted like a tree, a little music stage with a drum, rainbow-coloured sand. |

## 3. World backgrounds (tall 9:16, attach the anchor)

These sit behind the level path inside each world, so they must be **calm and low-detail in the middle** where the path and buttons go.

Start each with: *"Same art style as the attached image. A tall portrait (9:16) background for a mobile game screen. Soft, slightly blurred, low contrast, simple shapes, with a large calm empty area in the centre for buttons. No characters. No text, no letters, no numbers."*

| File | Prompt |
|---|---|
| `bg-math.png` | Warm sandy beach at the foot of the orange volcano, crystals at the edges, sea along the bottom. |
| `bg-words.png` | A soft green forest clearing, trees framing the left and right edges, dappled light. |
| `bg-science.png` | Deep navy space with faint stars, planets small at the corners, a soft purple glow. |
| `bg-globe.png` | Teal river valley with a granite rock dome far in the distance, warm sky. |
| `bg-book.png` | Golden hills at sunrise, distant library on a hill, soft clouds. |
| `bg-art.png` | Pink coastline with paint-splash rocks at the edges, pastel sky. |
| `bg-arena.png` | A dark stadium arena at night for a quiz battle: deep navy and indigo, spotlights from the top corners, a glowing round stage at the bottom, crowd as soft blurred lights. Exciting but not busy. |

## 4. Mascots (square, attach the anchor)

One guide per world who cheers the child on. Start each with: *"Same art style as the attached image. A cute friendly mascot character for a children's learning game, full body, standing, waving, big expressive eyes, centered, flat white background. No text, no letters, no numbers."*

| File | Name | Prompt |
|---|---|---|
| `mascot-math.png` | Blaze | A small round lava sprite made of warm orange glowing rock with a flickering flame tuft on its head. |
| `mascot-words.png` | Owlu | A chubby green owl wearing round reading glasses, holding a pencil. |
| `mascot-science.png` | Bolt | A small round purple robot with a glass dome head and a tiny antenna that sparks. |
| `mascot-globe.png` | Ijapa | A clever, smiling tortoise with a colourful patterned shell, wearing a tiny traveller's satchel. |
| `mascot-book.png` | Sage | A gentle baby elephant in soft yellow holding an open book with its trunk. |
| `mascot-art.png` | Pip | A playful pink chameleon with a paint-splattered tail holding a paintbrush. |

Then, for each mascot, three moods (attach that mascot's image): *"The same character, same style, now [cheering with both arms up | thinking with a hand on its chin | sad but encouraging, giving a thumbs up]."* Name them `mascot-math-cheer.png`, `mascot-math-think.png`, `mascot-math-oops.png`, and so on.

## 5. Bosses (square, attach the anchor)

Waits at the top of every topic's path. Big and impressive, never frightening; these are for children. Start each with: *"Same art style as the attached image. A big friendly-but-tough boss character for a children's quiz game, full body, arms crossed, confident grin, centered, flat white background. Not scary. No text, no letters, no numbers."*

| File | Name | Prompt |
|---|---|---|
| `boss-math.png` | The Volcano King | A giant made of orange volcanic rock with a crown of glowing crystals. |
| `boss-words.png` | The Grand Oak | A huge friendly tree giant with a beard of leaves and a book-shaped shield. |
| `boss-science.png` | Mega Bolt | A big chrome-and-purple robot with glowing visor eyes and a lab-coat cape. |
| `boss-globe.png` | The Rock Guardian | A wise granite giant shaped like Zuma Rock, with patterned markings. |
| `boss-book.png` | The Lantern Keeper | A tall calm figure in golden robes holding a huge glowing lantern (face hidden by a hood, kind eyes). |
| `boss-art.png` | Maestro Splash | A tall flamboyant chameleon in a painter's beret with a drum and a giant brush. |

## 6. Avatars (square, attach the anchor)

Kids pick a character instead of uploading a photo. Make **24 different children**, aged about 6–16, as **head-and-shoulders portraits**, so every child can find one that looks like them. More unlock with arena trophies later.

Start each with: *"Same art style as the attached image. A head-and-shoulders portrait of a happy cartoon Nigerian child, facing slightly to the side, big friendly eyes, centered, flat white background. No text, no letters, no numbers."* Then add one line from the list. Name them `avatar-01.png` to `avatar-24.png`.

1. Girl, dark brown skin, short natural afro puffs, yellow T-shirt.
2. Boy, dark skin, low haircut, school uniform (white shirt, green tie).
3. Girl, medium brown skin, long braids with beads, purple top.
4. Boy, light brown skin, curly top, red hoodie.
5. Girl, dark skin, wearing a blue hijab, glasses.
6. Boy, deep brown skin, high-top fade, orange jersey.
7. Girl, brown skin, gele-style headwrap in green and gold.
8. Boy, dark skin, wearing a kufi cap, white kaftan.
9. Girl, light brown skin, two big bunches, pink dress.
10. Boy, brown skin, glasses, sweater vest, holding a book.
11. Girl, dark skin, cornrows, football jersey.
12. Boy, medium skin, short dreadlocks, headphones round his neck.
13. Girl, brown skin, short pixie cut, star earrings, teal jacket.
14. Boy, dark skin, bucket hat, yellow T-shirt.
15. Girl, deep brown skin, wearing a white hijab, big smile.
16. Boy, light brown skin, side-part haircut, blue uniform blazer.
17. Girl, dark skin, Bantu knots, orange top.
18. Boy, brown skin, curly afro, paint on his cheek, art smock.
19. Girl, medium brown skin, ponytail, science goggles on her head.
20. Boy, dark skin, wheelchair visible at the shoulders, green hoodie, thumbs up.
21. Girl, brown skin, hearing aid, braids, lilac top.
22. Boy, deep brown skin, school cap, backpack straps.
23. Girl, dark skin, Ankara-print dress in bright patterns.
24. Boy, light brown skin, round glasses, robot T-shirt.

## Checklist before handing over

- [ ] Anchor island you're happy with
- [ ] 6 islands, 7 backgrounds, 6 mascots (+ 18 moods), 6 bosses, 24 avatars
- [ ] No text anywhere, no real photos used
- [ ] Files named as above
