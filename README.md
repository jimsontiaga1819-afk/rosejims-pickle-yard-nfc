# Rose Jim's Pickle Yard — NFC landing page

The page players land on when they tap the Pickle Yard NFC tag.

**Live:** https://jimsontiaga1819-afk.github.io/rosejims-pickle-yard-nfc/

## What's inside
- NFC "tap detected" intro with a circular reveal
- Interactive 3D pickleballs (Three.js) that you can click or tap to hit
- Tap menu: live scoreboard, monthly rankings, home site, save the contact (.vcf), share with a partner
- **Rally** mini-game on canvas, with your personal best saved on the device
- Pinned "how the Yard runs" steps, flip cards with pickleball lingo, confetti and haptics
- Smooth scrolling (Lenis), GSAP + ScrollTrigger animations, magnetic buttons, tilt cards
- Respects `prefers-reduced-motion`; works without a build step

## Libraries (loaded from jsDelivr)
- [GSAP 3.12.5](https://github.com/greensock/GSAP) + ScrollTrigger
- [Lenis 1.1.13](https://github.com/darkroomengineering/lenis)
- [Three.js r160](https://github.com/mrdoob/three.js)
- [canvas-confetti 1.9.3](https://github.com/catdad/canvas-confetti)

## Programming the NFC tag
Write a **URI record** with the live URL above to any NTAG213/215/216 tag (e.g. with the free *NFC Tools* app → Write → Add a record → URL).
Add `?src=nfc` if you want to tell tag taps apart in analytics later.
