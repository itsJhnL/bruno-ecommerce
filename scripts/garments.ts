/**
 * scripts/garments.ts
 *
 * Garment geometry for the BRUNO image set.
 *
 * The first pass at product imagery drew every product as the same lit arch of
 * cloth. It was a handsome plate and a useless picture: a belt, a scarf and an
 * overcoat were indistinguishable at thumbnail size, which is exactly the size
 * a shopper sees first. This module supplies the missing half — the shape of
 * the thing — while `generate-images.ts` keeps supplying the material, the
 * light and the ground.
 *
 * Everything is drawn on a 1000 × 1250 stage, symmetrical about x = 500, so a
 * garment can be described by its right-hand half and mirrored with `mx()`.
 * Coordinates are deliberately literal rather than computed: a coat is a coat,
 * and a parametric coat generator would be harder to read than the coat.
 */

export const STAGE_W = 1000;
export const STAGE_H = 1250;
const CX = STAGE_W / 2;

/** Mirror an x coordinate about the centre line. */
const mx = (x: number) => 2 * CX - x;

/** A cloth panel drawn over the body — lapel, placket, pocket, rib. */
export interface Panel {
  d: string;
  /** How the panel catches the light relative to the body. */
  tone: "shadow" | "body" | "highlight";
  opacity?: number;
}

export interface Garment {
  /** The silhouette. Filled with the cloth gradient and the weave. */
  outline: string;
  /** Panels drawn over the body, in order. */
  panels: Panel[];
  /** Structural seams — dark, continuous. */
  seams: string[];
  /** Topstitching — champagne, dashed. */
  stitches: string[];
  /** Metal and horn: buttons, zips, buckles, eyelets. Raw SVG, drawn on top. */
  hardware: string;
  /** Raw SVG drawn INSIDE the silhouette clip — ribbing, knit texture. */
  texture?: string;
  /** Where the second photograph crops to. [x, y, w, h] on the stage. */
  detailBox: [number, number, number, number];
  /** Ground contact, for the cast shadow. [cx, cy, rx, ry] */
  shadow: [number, number, number, number];
}

export type GarmentKind =
  | "coat"
  | "topcoat"
  | "blazer"
  | "biker"
  | "crew"
  | "rollneck"
  | "shirt"
  | "overshirt"
  | "trouser"
  | "scarf"
  | "wrap"
  | "belt"
  | "bag";

/* -------------------------------------------------------------------------- */
/* Small helpers                                                               */
/* -------------------------------------------------------------------------- */

const button = (cx: number, cy: number, r: number) =>
  `<g>
    <circle cx="${cx}" cy="${cy + 1.5}" r="${r}" fill="#000" fill-opacity="0.5"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#horn)"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#000" stroke-opacity="0.45" stroke-width="1"/>
    <circle cx="${cx - r * 0.3}" cy="${cy - r * 0.3}" r="${r * 0.16}" fill="#000" fill-opacity="0.55"/>
    <circle cx="${cx + r * 0.3}" cy="${cy + r * 0.3}" r="${r * 0.16}" fill="#000" fill-opacity="0.55"/>
    <path d="M ${cx - r * 0.62} ${cy - r * 0.62} a ${r * 0.88} ${r * 0.88} 0 0 1 ${r * 0.9} ${-r * 0.1}"
          fill="none" stroke="#fff" stroke-opacity="0.28" stroke-width="${r * 0.16}" stroke-linecap="round"/>
  </g>`;

/** A zip: tape, teeth, and a pull that catches the light. */
const zip = (d: string, pullAt: [number, number] | null, scale = 1) =>
  `<g>
    <path d="${d}" fill="none" stroke="#000" stroke-opacity="0.55" stroke-width="${9 * scale}" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="url(#brass)" stroke-opacity="0.9" stroke-width="${5 * scale}" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="#000" stroke-opacity="0.5" stroke-width="${5 * scale}"
          stroke-dasharray="${2.4 * scale} ${3.2 * scale}" stroke-linecap="butt"/>
    ${
      pullAt
        ? `<g transform="translate(${pullAt[0]} ${pullAt[1]})">
             <rect x="${-7 * scale}" y="${-9 * scale}" width="${14 * scale}" height="${18 * scale}"
                   rx="${3 * scale}" fill="url(#brass)" stroke="#000" stroke-opacity="0.45" stroke-width="1"/>
             <rect x="${-3.4 * scale}" y="${7 * scale}" width="${6.8 * scale}" height="${30 * scale}"
                   rx="${3.4 * scale}" fill="none" stroke="url(#brass)" stroke-width="${3.4 * scale}"/>
           </g>`
        : ""
    }
  </g>`;

/** Ribbing — the knitted band at a hem or cuff. */
function ribbing(x: number, y: number, w: number, h: number, step = 13): string {
  const lines: string[] = [];
  for (let i = x + step / 2; i < x + w; i += step) {
    lines.push(
      `<line x1="${Math.round(i)}" y1="${y}" x2="${Math.round(i)}" y2="${y + h}" stroke="#000" stroke-opacity="0.30" stroke-width="3"/>`,
      `<line x1="${Math.round(i + step / 2)}" y1="${y}" x2="${Math.round(i + step / 2)}" y2="${y + h}" stroke="#fff" stroke-opacity="0.09" stroke-width="2"/>`
    );
  }
  return lines.join("");
}

/* -------------------------------------------------------------------------- */
/* Torso garments                                                              */
/* -------------------------------------------------------------------------- */

/**
 * A long coat: notch lapels, double-breasted front, welt pockets.
 * `long` distinguishes the overcoat from the slightly shorter topcoat.
 *
 * The revere — collar and both lapels — is drawn as ONE symmetric closed shape
 * rather than two mirrored halves. The first attempt mirrored them and gave
 * each half a different tone, which read as a tear at the neck rather than as
 * cloth folded back.
 */
function coat(long: boolean): Garment {
  const hem = long ? 1112 : 1046;

  const outline = `
    M 264 252
    L 448 262
    C 470 302 530 302 552 262
    L 736 252
    C 794 302 806 522 796 752
    L 704 766
    C 694 562 666 488 622 472
    C 634 700 642 900 648 ${hem}
    C 562 ${hem + 22} 438 ${hem + 22} 352 ${hem}
    C 358 900 366 700 378 472
    C 334 488 306 562 296 766
    L 204 752
    C 194 522 206 302 264 252
    Z`;

  /* A notch lapel is three shapes, not one: the collar band across the back of
     the neck, the dark V of the front opening, and a lapel either side of it.
     Drawing the revere as a single filled outline — the previous attempt —
     produced a pale leaf, because nothing in it was darker than the body. */
  const vOpening = `
    M 500 616
    C 522 500 546 390 566 292
    L 434 292
    C 454 390 478 500 500 616
    Z`;

  const collarBand = `
    M 434 292 C 470 272 530 272 566 292
    L 620 316 C 636 284 618 256 578 246
    C 530 236 470 236 422 246
    C 382 256 364 284 380 316
    Z`;

  const lapelR = `
    M 500 616
    C 522 500 546 390 566 292
    L 620 316 L 596 372 L 626 430
    C 588 500 542 566 500 616
    Z`;

  const lapelL = `
    M 500 616
    C ${mx(522)} 500 ${mx(546)} 390 ${mx(566)} 292
    L ${mx(620)} 316 L ${mx(596)} 372 L ${mx(626)} 430
    C ${mx(588)} 500 ${mx(542)} 566 500 616
    Z`;

  return {
    outline,
    panels: [
      { d: collarBand, tone: "shadow", opacity: 0.46 },
      { d: vOpening, tone: "shadow", opacity: 0.74 },
      { d: lapelR, tone: "highlight", opacity: 0.15 },
      { d: lapelL, tone: "highlight", opacity: 0.15 },
      // Welt pockets.
      { d: `M 366 830 L 468 824 L 468 854 L 366 860 Z`, tone: "shadow", opacity: 0.5 },
      { d: `M 532 824 L 634 830 L 634 860 L 532 854 Z`, tone: "shadow", opacity: 0.5 },
      { d: `M 566 486 L 622 492 L 622 508 L 566 502 Z`, tone: "shadow", opacity: 0.45 },
    ],
    seams: [
      // The fold edge of each lapel, and the notch that interrupts it.
      `M 500 616 C 542 566 588 500 626 430 L 596 372 L 620 316`,
      `M 500 616 C ${mx(542)} 566 ${mx(588)} 500 ${mx(626)} 430 L ${mx(596)} 372 L ${mx(620)} 316`,
      // The front edges, which meet at the break point.
      `M 500 616 C 522 500 546 390 566 292`,
      `M 500 616 C ${mx(522)} 500 ${mx(546)} 390 ${mx(566)} 292`,
      // The gorge — collar meeting lapel.
      `M 566 292 L 620 316`,
      `M ${mx(566)} 292 L ${mx(620)} 316`,
      // The wrap of the front below the break.
      `M 500 616 C 490 780 484 950 482 ${hem - 20}`,
      // Sleeve heads.
      `M 736 252 C 700 320 686 400 682 472`,
      `M ${mx(736)} 252 C ${mx(700)} 320 ${mx(686)} 400 ${mx(682)} 472`,
      // Cuff turnbacks.
      `M 716 690 L 800 678`,
      `M ${mx(716)} 690 L ${mx(800)} 678`,
    ],
    stitches: [
      `M 366 830 L 468 824`,
      `M 532 824 L 634 830`,
      `M 500 640 C 490 790 484 950 482 ${hem - 30}`,
    ],
    hardware: [
      button(452, 566, 15),
      button(452, 678, 15),
      button(452, 790, 15),
      button(548, 566, 15),
      button(548, 678, 15),
      button(548, 790, 15),
    ].join(""),
    detailBox: [368, 232, 300, 375],
    shadow: [500, hem + 14, 210, 26],
  };
}

/** A single-breasted blazer: shorter, waisted, two buttons, patch welts. */
function blazer(): Garment {
  const outline = `
    M 276 264
    L 452 274
    C 474 312 526 312 548 274
    L 724 264
    C 776 312 792 508 784 720
    L 700 734
    C 690 556 664 486 616 470
    C 626 660 632 800 636 900
    C 590 918 550 924 500 924
    C 450 924 410 918 364 900
    C 368 800 374 660 384 470
    C 336 486 310 556 300 734
    L 216 720
    C 208 508 224 312 276 264
    Z`;

  const vOpening = `
    M 500 600
    C 520 496 542 388 560 302
    L 440 302
    C 458 388 480 496 500 600
    Z`;

  const collarBand = `
    M 440 302 C 472 284 528 284 560 302
    L 610 324 C 624 294 608 268 572 258
    C 528 250 472 250 428 258
    C 392 268 376 294 390 324
    Z`;

  const lapelR = `
    M 500 600
    C 520 496 542 388 560 302
    L 610 324 L 588 376 L 616 428
    C 582 492 540 552 500 600
    Z`;

  const lapelL = `
    M 500 600
    C ${mx(520)} 496 ${mx(542)} 388 ${mx(560)} 302
    L ${mx(610)} 324 L ${mx(588)} 376 L ${mx(616)} 428
    C ${mx(582)} 492 ${mx(540)} 552 500 600
    Z`;

  return {
    outline,
    panels: [
      { d: collarBand, tone: "shadow", opacity: 0.46 },
      { d: vOpening, tone: "shadow", opacity: 0.74 },
      { d: lapelR, tone: "highlight", opacity: 0.15 },
      { d: lapelL, tone: "highlight", opacity: 0.15 },
      { d: `M 566 480 L 618 486 L 618 500 L 566 494 Z`, tone: "shadow", opacity: 0.45 },
      { d: `M 380 764 L 470 758 L 470 786 L 380 792 Z`, tone: "shadow", opacity: 0.5 },
      { d: `M 530 758 L 620 764 L 620 792 L 530 786 Z`, tone: "shadow", opacity: 0.5 },
    ],
    seams: [
      `M 500 600 C 540 552 582 492 616 428 L 588 376 L 610 324`,
      `M 500 600 C ${mx(540)} 552 ${mx(582)} 492 ${mx(616)} 428 L ${mx(588)} 376 L ${mx(610)} 324`,
      `M 500 600 C 520 496 542 388 560 302`,
      `M 500 600 C ${mx(520)} 496 ${mx(542)} 388 ${mx(560)} 302`,
      `M 560 302 L 610 324`,
      `M ${mx(560)} 302 L ${mx(610)} 324`,
      `M 500 600 C 498 720 496 830 496 908`,
      `M 724 264 C 692 330 678 402 676 470`,
      `M ${mx(724)} 264 C ${mx(692)} 330 ${mx(678)} 402 ${mx(676)} 470`,
      // Waist suppression — what makes a blazer read as tailored.
      `M 596 508 C 610 620 618 760 622 892`,
      `M ${mx(596)} 508 C ${mx(610)} 620 ${mx(618)} 760 ${mx(622)} 892`,
    ],
    stitches: [`M 380 764 L 470 758`, `M 530 758 L 620 764`],
    hardware: [
      button(508, 630, 14),
      button(506, 722, 14),
      button(766, 700, 9),
      button(766, 722, 9),
      button(mx(766), 700, 9),
      button(mx(766), 722, 9),
    ].join(""),
    detailBox: [376, 244, 300, 375],
    shadow: [500, 934, 190, 24],
  };
}

/** A biker jacket: asymmetric zip, snap collar, zipped cuffs and pockets. */
function biker(): Garment {
  const outline = `
    M ${mx(730)} 276
    L 452 284
    C 476 330 524 330 548 284
    L 730 276
    C 786 322 802 512 794 700
    L 706 716
    C 698 552 672 490 620 474
    C 630 636 636 760 640 856
    C 592 878 548 886 500 886
    C 452 886 408 878 360 856
    C 364 760 370 636 380 474
    C 328 490 302 552 294 716
    L 206 700
    C 198 512 214 322 270 276
    Z`;

  /* The lapel-collar of a biker folds back on both sides, but the front is
     asymmetric — that off-centre zip is the whole signature of the garment. */
  const collarR = `M 548 288 L 618 272 C 640 306 638 348 620 380 L 556 356 Z`;
  const collarL = `M 452 288 L ${mx(618)} 272 C ${mx(640)} 306 ${mx(638)} 348 ${mx(620)} 380 L ${mx(556)} 356 Z`;
  const stormFlap = `M 556 356 C 592 480 600 660 598 858 L 528 872 C 524 660 528 476 500 352 Z`;

  return {
    outline,
    panels: [
      { d: collarR, tone: "highlight", opacity: 0.14 },
      { d: collarL, tone: "shadow", opacity: 0.32 },
      { d: stormFlap, tone: "highlight", opacity: 0.1 },
      // Zipped slash pockets.
      { d: `M 386 690 L 470 706 L 464 730 L 380 714 Z`, tone: "shadow", opacity: 0.45 },
      { d: `M 614 690 L 700 674 L 706 698 L 620 714 Z`, tone: "shadow", opacity: 0.45 },
      // Waistband.
      { d: `M 360 838 C 452 862 548 862 640 838 L 644 872 C 548 896 452 896 356 872 Z`, tone: "shadow", opacity: 0.42 },
    ],
    seams: [
      `M 620 380 C 656 500 668 660 672 838`,
      `M ${mx(620)} 380 C ${mx(656)} 500 ${mx(668)} 660 ${mx(672)} 838`,
      `M 730 276 C 700 340 686 412 684 474`,
      `M ${mx(730)} 276 C ${mx(700)} 340 ${mx(686)} 412 ${mx(684)} 474`,
      // Yoke across the chest.
      `M 300 470 C 400 440 600 440 700 470`,
    ],
    stitches: [
      `M 386 690 L 470 706`,
      `M 614 690 L 700 674`,
      `M 360 846 C 452 870 548 870 640 846`,
    ],
    hardware: [
      zip(`M 528 372 C 552 520 558 690 556 856`, [556, 700], 1.15),
      zip(`M 380 714 L 464 730`, null, 0.8),
      zip(`M 620 714 L 706 698`, null, 0.8),
      zip(`M 712 690 L 786 678`, null, 0.8),
      zip(`M ${mx(712)} 690 L ${mx(786)} 678`, null, 0.8),
      // Collar snaps.
      `<circle cx="612" cy="366" r="8" fill="url(#brass)" stroke="#000" stroke-opacity="0.4"/>`,
      `<circle cx="${mx(612)}" cy="366" r="8" fill="url(#brass)" stroke="#000" stroke-opacity="0.4"/>`,
    ].join(""),
    detailBox: [430, 268, 300, 375],
    shadow: [500, 896, 180, 22],
  };
}

/**
 * A knit: crew neck or rollneck, with ribbed neck, cuffs and hem.
 *
 * Three things make a jumper read as a jumper rather than a tunic: an opening
 * you can see into, ribbing at every edge, and a body that stops at the hip.
 * The first version had none of them.
 */
function knit(roll: boolean): Garment {
  const hem = 856;
  const shoulder = roll ? 316 : 312;

  const outline = roll
    ? `M 300 ${shoulder}
       C 448 292 448 216 456 190
       C 500 172 546 176 580 194
       C 592 220 578 286 552 ${shoulder}
       L 700 ${shoulder}
       C 764 352 794 524 796 694
       L 706 710
       C 700 566 670 494 602 478
       C 608 626 612 764 612 ${hem}
       C 540 ${hem + 22} 460 ${hem + 22} 388 ${hem}
       C 388 764 392 626 398 478
       C 330 494 300 566 294 710
       L 204 694
       C 206 524 236 352 300 ${shoulder}
       Z`
    : `M 300 ${shoulder}
       L 428 320
       C 452 388 548 388 572 320
       L 700 ${shoulder}
       C 764 352 794 524 796 694
       L 706 710
       C 700 566 670 494 602 478
       C 608 626 612 764 612 ${hem}
       C 540 ${hem + 22} 460 ${hem + 22} 388 ${hem}
       C 388 764 392 626 398 478
       C 330 494 300 566 294 710
       L 204 694
       C 206 524 236 352 300 ${shoulder}
       Z`;

  /* The opening. On a crew it is the neck hole; on a rollneck it is the mouth
     of the collar, which is why it sits higher and narrower. */
  const opening = roll
    ? `M 462 196 C 500 180 542 184 574 200 C 546 224 468 222 462 196 Z`
    : `M 434 322 C 456 372 544 372 566 322 C 544 344 456 344 434 322 Z`;

  const neckRib = roll
    ? `M 456 190 C 500 172 546 176 580 194 C 592 220 578 286 552 ${shoulder}
       C 500 330 452 328 448 ${shoulder} C 448 292 448 216 456 190 Z`
    : `M 428 320 C 452 388 548 388 572 320
       C 578 300 570 288 556 288 C 532 336 468 336 444 288 C 430 288 422 300 428 320 Z`;

  return {
    outline,
    panels: [
      { d: neckRib, tone: "shadow", opacity: 0.34 },
      { d: opening, tone: "shadow", opacity: 0.82 },
      // Hem band.
      { d: `M 388 ${hem - 54} C 460 ${hem - 40} 540 ${hem - 40} 612 ${hem - 54}
            C 612 ${hem - 10} 612 ${hem} 612 ${hem}
            C 540 ${hem + 22} 460 ${hem + 22} 388 ${hem} Z`, tone: "shadow", opacity: 0.3 },
      // Cuff bands.
      { d: `M 706 660 L 796 646 L 796 694 L 706 710 Z`, tone: "shadow", opacity: 0.3 },
      { d: `M ${mx(706)} 660 L ${mx(796)} 646 L ${mx(796)} 694 L ${mx(706)} 710 Z`, tone: "shadow", opacity: 0.3 },
    ],
    seams: [
      // A soft saddle shoulder, not the hard triangle the first version drew.
      `M 668 ${shoulder + 6} C 640 384 620 430 612 480`,
      `M ${mx(668)} ${shoulder + 6} C ${mx(640)} 384 ${mx(620)} 430 ${mx(612)} 480`,
    ],
    stitches: [],
    hardware: "",
    // Ribbing is literal knitting — lines, not a fill. It is drawn inside the
    // silhouette clip so it cannot spill past the hem.
    texture: [
      ribbing(384, hem - 52, 232, 78),
      `<g transform="rotate(-9 750 678)">${ribbing(700, 646, 104, 66, 11)}</g>`,
      `<g transform="rotate(9 250 678)">${ribbing(196, 646, 104, 66, 11)}</g>`,
    ].join(""),
    detailBox: roll ? [370, 168, 300, 375] : [368, 268, 300, 375],
    shadow: [500, hem + 30, 178, 22],
  };
}

/** A shirt: point collar, front placket, buttoned cuffs, curved hem. */
function shirt(overshirt: boolean): Garment {
  const hem = overshirt ? 946 : 918;
  const outline = `
    M ${mx(706)} 300
    L 446 308
    C 470 356 530 356 554 308
    L 706 300
    C 768 346 796 524 798 700
    L 708 716
    C 702 564 672 492 604 476
    C 610 642 614 796 616 ${hem - 40}
    C 578 ${hem} 540 ${hem + 10} 500 ${hem + 10}
    C 460 ${hem + 10} 422 ${hem} 384 ${hem - 40}
    C 386 796 390 642 396 476
    C 328 492 298 564 292 716
    L 202 700
    C 204 524 232 346 294 300
    Z`;

  const collarR = `M 500 296 L 556 306 C 588 318 604 344 606 372 L 552 348 L 512 322 Z`;
  const collarL = `M 500 296 L ${mx(556)} 306 C ${mx(588)} 318 ${mx(604)} 344 ${mx(606)} 372 L ${mx(552)} 348 L ${mx(512)} 322 Z`;
  const stand = `M 446 308 C 470 282 530 282 554 308 C 530 298 470 298 446 308 Z`;
  const placket = `M 478 320 C 476 500 476 700 478 ${hem - 26} L 522 ${hem - 26} C 524 700 524 500 522 320 Z`;

  return {
    outline,
    panels: [
      { d: stand, tone: "shadow", opacity: 0.5 },
      { d: collarR, tone: "highlight", opacity: 0.14 },
      { d: collarL, tone: "shadow", opacity: 0.28 },
      { d: placket, tone: "highlight", opacity: 0.12 },
      ...(overshirt
        ? ([
            { d: `M 372 500 L 470 494 L 474 596 L 376 602 Z`, tone: "shadow", opacity: 0.34 },
            { d: `M 530 494 L 628 500 L 624 602 L 526 596 Z`, tone: "shadow", opacity: 0.34 },
          ] as Panel[])
        : ([{ d: `M 556 480 L 620 486 L 618 528 L 554 522 Z`, tone: "shadow", opacity: 0.3 }] as Panel[])),
      // Buttoned cuffs.
      { d: `M 706 660 L 798 646 L 800 700 L 708 716 Z`, tone: "shadow", opacity: 0.34 },
      { d: `M ${mx(706)} 660 L ${mx(798)} 646 L ${mx(800)} 700 L ${mx(708)} 716 Z`, tone: "shadow", opacity: 0.34 },
    ],
    seams: [
      `M 672 300 C 640 372 620 428 614 478`,
      `M ${mx(672)} 300 C ${mx(640)} 372 ${mx(620)} 428 ${mx(614)} 478`,
      // Yoke.
      `M 300 396 C 400 366 600 366 700 396`,
    ],
    stitches: [
      `M 478 322 C 476 500 476 700 478 ${hem - 30}`,
      `M 522 322 C 524 500 524 700 522 ${hem - 30}`,
      `M 556 310 C 588 322 602 346 604 372`,
      `M ${mx(556)} 310 C ${mx(588)} 322 ${mx(602)} 346 ${mx(604)} 372`,
      ...(overshirt ? [`M 372 500 L 470 494`, `M 530 494 L 628 500`] : []),
    ],
    hardware: [
      button(500, 396, 11),
      button(500, 500, 11),
      button(500, 604, 11),
      button(500, 708, 11),
      button(500, 812, 11),
      button(752, 674, 9),
      button(mx(752), 674, 9),
    ].join(""),
    detailBox: [402, 276, 300, 375],
    shadow: [500, hem + 26, 180, 22],
  };
}

/** Tailored trousers, shown flat-front with a pressed crease. */
function trouser(): Garment {
  const outline = `
    M 332 330
    L 668 330
    C 676 560 684 860 692 1148
    L 566 1148
    C 552 916 528 736 500 650
    C 472 736 448 916 434 1148
    L 308 1148
    C 316 860 324 560 332 330
    Z`;

  return {
    outline,
    panels: [
      // Waistband.
      { d: `M 330 330 L 670 330 L 672 386 L 328 386 Z`, tone: "shadow", opacity: 0.4 },
      // Pleat shadow either side of the fly.
      { d: `M 470 386 L 486 386 L 492 640 L 476 640 Z`, tone: "shadow", opacity: 0.3 },
      { d: `M 514 386 L 530 386 L 524 640 L 508 640 Z`, tone: "shadow", opacity: 0.3 },
      // Slant pockets.
      { d: `M 344 396 L 380 396 L 348 500 L 336 500 Z`, tone: "shadow", opacity: 0.34 },
      { d: `M ${mx(344)} 396 L ${mx(380)} 396 L ${mx(348)} 500 L ${mx(336)} 500 Z`, tone: "shadow", opacity: 0.34 },
    ],
    seams: [
      // The crease is what makes a trouser read as tailored rather than as jeans.
      `M 398 386 C 392 620 380 880 372 1146`,
      `M 604 386 C 610 620 622 880 630 1146`,
      `M 500 386 C 500 480 500 570 500 648`,
      // Hem turn-ups.
      `M 312 1096 L 432 1096`,
      `M 568 1096 L 688 1096`,
    ],
    stitches: [`M 330 340 L 670 340`, `M 330 378 L 670 378`],
    hardware: [
      button(500, 358, 11),
      // Belt loops.
      `<rect x="366" y="326" width="13" height="64" rx="4" fill="#000" fill-opacity="0.4"/>`,
      `<rect x="${mx(379)}" y="326" width="13" height="64" rx="4" fill="#000" fill-opacity="0.4"/>`,
      `<rect x="494" y="322" width="13" height="42" rx="4" fill="#000" fill-opacity="0.35"/>`,
    ].join(""),
    detailBox: [330, 320, 300, 375],
    shadow: [500, 1160, 210, 24],
  };
}

/**
 * A scarf, folded once and laid out: a narrow loop at the top, two tails
 * falling and widening, fringe at both ends.
 *
 * The first version drew a free-floating S-curve, which read as an abstract
 * ribbon rather than as something you could put round your neck. A loop and
 * two ends is the shape everybody already recognises.
 */
function drape(large: boolean): Garment {
  const w = large ? 1.26 : 1;
  const s = (x: number) => Math.round(500 + (x - 500) * w);
  const bottom = large ? 990 : 954;

  const outline = `
    M ${s(446)} 258
    C ${s(400)} 268 ${s(372)} 300 ${s(366)} 344
    C ${s(340)} 500 ${s(300)} 700 ${s(258)} ${bottom - 40}
    L ${s(408)} ${bottom}
    C ${s(440)} 720 ${s(468)} 520 ${s(492)} 372
    C ${s(516)} 520 ${s(544)} 720 ${s(576)} ${bottom}
    L ${s(726)} ${bottom - 40}
    C ${s(684)} 700 ${s(644)} 500 ${s(618)} 344
    C ${s(612)} 300 ${s(584)} 268 ${s(538)} 258
    C ${s(566)} 300 ${s(570)} 336 ${s(556)} 366
    C ${s(534)} 306 ${s(466)} 306 ${s(444)} 366
    C ${s(430)} 336 ${s(434)} 300 ${s(446)} 258
    Z`;

  /* Fringe at both ends — the detail that says cashmere rather than acrylic. */
  const fringe: string[] = [];
  for (let i = 0; i < 11; i += 1) {
    const lx = s(266 + i * 13);
    const rx = s(584 + i * 13);
    const drop = 34 + ((i * 37) % 9) * 4;
    fringe.push(
      `M ${lx} ${bottom - 26} C ${lx - 3} ${bottom + drop - 22} ${lx + 4} ${bottom + drop - 8} ${lx + 1} ${bottom + drop}`,
      `M ${rx} ${bottom - 26} C ${rx - 3} ${bottom + drop - 22} ${rx + 4} ${bottom + drop - 8} ${rx + 1} ${bottom + drop}`
    );
  }

  return {
    outline,
    panels: [
      // The loop turns back on itself, so its underside is in shadow.
      { d: `M ${s(444)} 366 C ${s(466)} 306 ${s(534)} 306 ${s(556)} 366
            C ${s(534)} 336 ${s(466)} 336 ${s(444)} 366 Z`, tone: "shadow", opacity: 0.55 },
      // The right tail lies over the left, so it catches more light.
      { d: `M ${s(492)} 372 C ${s(516)} 520 ${s(544)} 720 ${s(576)} ${bottom}
            L ${s(726)} ${bottom - 40} C ${s(684)} 700 ${s(644)} 500 ${s(618)} 344
            C ${s(612)} 300 ${s(584)} 268 ${s(538)} 258 C ${s(566)} 300 ${s(570)} 336 ${s(556)} 366 Z`,
        tone: "highlight", opacity: 0.1 },
    ],
    seams: [
      `M ${s(492)} 372 C ${s(478)} 560 ${s(444)} 780 ${s(408)} ${bottom - 10}`,
    ],
    stitches: fringe,
    hardware: "",
    detailBox: [s(392), 250, 300, 375],
    shadow: [500, bottom + 46, 240, 24],
  };
}

/** A belt, coiled once with the buckle laid over the coil. */
function belt(): Garment {
  const outline = `
    M 500 296
    C 654 296 780 396 780 520
    C 780 644 654 744 500 744
    C 346 744 220 644 220 520
    C 220 396 346 296 500 296
    Z
    M 500 396
    C 402 396 322 452 322 520
    C 322 588 402 644 500 644
    C 598 644 678 588 678 520
    C 678 452 598 396 500 396
    Z`;

  /* The free end, crossing the coil and falling away. */
  const tail = `
    M 322 540 C 300 640 320 760 396 846
    C 428 882 470 900 512 902
    L 512 838
    C 470 834 436 812 414 776
    C 372 706 366 620 384 546 Z`;

  const holes: string[] = [];
  for (let i = 0; i < 5; i += 1) {
    holes.push(
      `<ellipse cx="${462 + i * 2}" cy="${790 + i * 26}" rx="7" ry="9" fill="#000" fill-opacity="0.66"/>`,
      `<ellipse cx="${462 + i * 2}" cy="${788 + i * 26}" rx="7" ry="9" fill="none" stroke="#fff" stroke-opacity="0.09" stroke-width="1.4"/>`
    );
  }

  return {
    outline: `${outline} ${tail}`,
    panels: [
      { d: `M 220 520 C 220 644 346 744 500 744 C 654 744 780 644 780 520 L 678 520 C 678 588 598 644 500 644 C 402 644 322 588 322 520 Z`, tone: "shadow", opacity: 0.34 },
      { d: `M 322 540 C 300 640 320 760 396 846 L 440 812 C 380 736 372 630 384 552 Z`, tone: "highlight", opacity: 0.12 },
    ],
    seams: [
      `M 500 316 C 640 318 758 406 760 520`,
      `M 500 724 C 360 722 242 634 240 520`,
    ],
    stitches: [
      `M 500 330 C 626 334 740 412 742 520`,
      `M 500 710 C 374 706 260 628 258 520`,
      `M 400 560 C 384 646 404 750 462 826`,
    ],
    hardware: `
      <g>
        <rect x="430" y="884" width="150" height="112" rx="16" fill="none"
              stroke="#000" stroke-opacity="0.55" stroke-width="26"/>
        <rect x="430" y="880" width="150" height="112" rx="16" fill="none"
              stroke="url(#brass)" stroke-width="20"/>
        <rect x="430" y="880" width="150" height="112" rx="16" fill="none"
              stroke="#fff" stroke-opacity="0.16" stroke-width="5"/>
        <path d="M 505 890 L 505 986" stroke="#000" stroke-opacity="0.5" stroke-width="18" stroke-linecap="round"/>
        <path d="M 505 886 L 505 982" stroke="url(#brass)" stroke-width="13" stroke-linecap="round"/>
        <path d="M 505 924 L 386 918" stroke="#000" stroke-opacity="0.5" stroke-width="15" stroke-linecap="round"/>
        <path d="M 505 920 L 386 914" stroke="url(#brass)" stroke-width="11" stroke-linecap="round"/>
      </g>
      ${holes.join("")}`,
    detailBox: [372, 800, 300, 375],
    shadow: [500, 760, 250, 28],
  };
}

/** A weekender holdall: rolled handles, end panel, zip along the top. */
function bag(): Garment {
  const outline = `
    M 236 552
    C 236 512 268 486 314 484
    L 686 484
    C 732 486 764 512 764 552
    C 776 660 776 774 760 862
    C 754 902 716 924 664 926
    L 336 926
    C 284 924 246 902 240 862
    C 224 774 224 660 236 552
    Z`;

  return {
    outline,
    panels: [
      // The end panel, which is what makes a holdall read as a cylinder.
      { d: `M 686 484 C 732 486 764 512 764 552 C 776 660 776 774 760 862 C 754 902 716 924 664 926 C 700 890 710 700 700 552 C 698 512 694 496 686 484 Z`, tone: "shadow", opacity: 0.38 },
      // Zip gusset.
      { d: `M 236 552 C 236 512 268 486 314 484 L 686 484 C 732 486 764 512 764 552 C 640 528 360 528 236 552 Z`, tone: "shadow", opacity: 0.3 },
      // Base shadow.
      { d: `M 240 830 C 400 872 600 872 760 830 C 756 878 750 902 736 914 L 264 914 C 250 902 244 878 240 830 Z`, tone: "shadow", opacity: 0.3 },
      // Leather handle wraps.
      { d: `M 412 380 L 436 380 L 436 452 L 412 452 Z`, tone: "highlight", opacity: 0.12 },
      { d: `M 564 380 L 588 380 L 588 452 L 564 452 Z`, tone: "highlight", opacity: 0.12 },
    ],
    seams: [
      `M 314 484 C 300 660 300 800 316 922`,
      `M 686 484 C 700 660 700 800 684 922`,
      `M 240 560 C 400 536 600 536 760 560`,
    ],
    stitches: [
      `M 250 566 C 400 544 600 544 750 566`,
      `M 256 856 C 400 890 600 890 744 856`,
      `M 322 496 C 310 664 310 796 324 912`,
      `M 678 496 C 690 664 690 796 676 912`,
    ],
    hardware: `
      ${zip(`M 258 544 C 400 522 600 522 742 544`, [500, 528], 1.2)}
      <g fill="none" stroke="#000" stroke-opacity="0.55" stroke-width="21" stroke-linecap="round">
        <path d="M 424 452 C 420 336 468 292 500 292 C 532 292 580 336 576 452"/>
      </g>
      <g fill="none" stroke="url(#leatherStrap)" stroke-width="15" stroke-linecap="round">
        <path d="M 424 448 C 420 332 468 288 500 288 C 532 288 580 332 576 448"/>
      </g>
      <g fill="none" stroke="#fff" stroke-opacity="0.12" stroke-width="3.5" stroke-linecap="round">
        <path d="M 428 440 C 424 336 470 296 500 296"/>
      </g>
      <circle cx="424" cy="470" r="13" fill="url(#brass)" stroke="#000" stroke-opacity="0.45"/>
      <circle cx="576" cy="470" r="13" fill="url(#brass)" stroke="#000" stroke-opacity="0.45"/>
      <rect x="250" y="612" width="26" height="46" rx="8" fill="url(#brass)" stroke="#000" stroke-opacity="0.4"/>
      <rect x="724" y="612" width="26" height="46" rx="8" fill="url(#brass)" stroke="#000" stroke-opacity="0.4"/>`,
    detailBox: [382, 400, 300, 375],
    shadow: [500, 936, 260, 28],
  };
}

/* -------------------------------------------------------------------------- */
/* Registry                                                                    */
/* -------------------------------------------------------------------------- */

export function buildGarment(kind: GarmentKind): Garment {
  switch (kind) {
    case "coat":
      return coat(true);
    case "topcoat":
      return coat(false);
    case "blazer":
      return blazer();
    case "biker":
      return biker();
    case "crew":
      return knit(false);
    case "rollneck":
      return knit(true);
    case "shirt":
      return shirt(false);
    case "overshirt":
      return shirt(true);
    case "trouser":
      return trouser();
    case "scarf":
      return drape(false);
    case "wrap":
      return drape(true);
    case "belt":
      return belt();
    case "bag":
      return bag();
  }
}

export { ribbing };
