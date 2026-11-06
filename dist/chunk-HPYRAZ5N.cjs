'use strict';

// src/objects/variants.ts
var objectDirections = [
  {
    id: "studio",
    name: "Studio objects",
    description: "Product photography: one object on a seamless sweep, soft light, a low lens."
  },
  {
    id: "paper-theatre",
    name: "Paper worlds",
    description: "Cut-card toy theatres: layered flats in a proscenium under one warm light."
  },
  { id: "kinetic", name: "Kinetic sculptures", description: "Brass armatures and glazed ceramic turning on a slate base." },
  { id: "cartoon", name: "Cartoon worlds", description: "Floating toy islands with toon shading, by day and by night." },
  {
    id: "realistic",
    name: "Realistic close\u2011ups",
    description: "Low close-ups on real surfaces under grazing window light."
  },
  { id: "abstract", name: "Abstract forms", description: "Refractive glass against bands of colour, lit from behind at night." }
];
var lookTable = {
  ai: [
    [2, "Kinetic \xB7 Neural orrery"],
    [5, "Abstract \xB7 Thought lattice"],
    [3, "Cartoon \xB7 Night workshop"]
  ],
  contact: [
    [0, "Signature inbox"],
    [1, "Blue inbox"],
    [2, "Terracotta inbox"],
    [3, "Cartoon \xB7 Little post office"]
  ],
  tennis: [
    [4, "Realistic \xB7 Match point"],
    [3, "Cartoon \xB7 Courtside club"],
    [0, "Studio \xB7 Club rally"]
  ],
  trading: [
    [2, "Kinetic \xB7 Market balance"],
    [5, "Abstract \xB7 Risk rhythm"],
    [0, "Studio \xB7 Market abacus"]
  ],
  server: [
    [4, "Realistic \xB7 Hot swap"],
    [0, "Studio \xB7 Inference hardware"]
  ],
  travel: [
    [0, "Studio \xB7 Folded atlas"],
    [1, "Paper \xB7 Alpine passage"],
    [2, "Kinetic \xB7 Armillary globe"]
  ],
  reading: [
    [4, "Realistic \xB7 Quiet chapter"],
    [3, "Cartoon \xB7 Reading nook"],
    [1, "Paper \xB7 A world inside"]
  ]
};
var objectLooks = Object.fromEntries(
  Object.entries(lookTable).map(([kind, looks]) => [kind, looks.map(([variant]) => variant)])
);
var objectVariants = Object.fromEntries(
  Object.entries(lookTable).map(([kind, looks]) => [kind, Object.fromEntries(looks)])
);
function chooseObjectVariant(kind, random = Math.random, step = 0) {
  const looks = objectLooks[kind];
  const first = Math.min(looks.length - 1, Math.max(0, Math.floor(random() * looks.length)));
  return looks[(first + step) % looks.length];
}
var objectEditions = {
  contact: ["Signature inbox", "Blue inbox", "Terracotta inbox"],
  tennis: ["Grass club", "Clay club", "Blue hardcourt"],
  trading: ["Breakout", "Pullback", "Range reversal"],
  server: ["Signature hardware", "Blue hardware", "Copper hardware"],
  travel: ["Woodland atlas", "Coastal atlas", "Desert atlas"]
};
var directionSymbols = ["\u25D2", "\u25B1", "\u25CE", "\u25A7", "\u25C9", "\u25C7"];
function parseObjectVariant(value) {
  const index = Number(value);
  return value != null && value !== "" && Number.isInteger(index) && index >= 0 && index < objectDirections.length ? index : 0;
}
function hasObjectLook(kind, variant) {
  return objectLooks[kind].includes(variant);
}
function objectDirectionIndex(kind, variant) {
  return kind === "contact" ? variant === 3 ? 3 : 0 : variant;
}
function normalizeObjectVariant(kind, variant) {
  return hasObjectLook(kind, variant) ? variant : objectLooks[kind][0];
}
function transferObjectVariant(from, to, variant) {
  if (from === to) return normalizeObjectVariant(to, variant);
  const direction = objectDirectionIndex(from, normalizeObjectVariant(from, variant));
  if (to === "contact") return direction === 3 ? 3 : 0;
  return normalizeObjectVariant(to, direction);
}

exports.chooseObjectVariant = chooseObjectVariant;
exports.directionSymbols = directionSymbols;
exports.hasObjectLook = hasObjectLook;
exports.normalizeObjectVariant = normalizeObjectVariant;
exports.objectDirectionIndex = objectDirectionIndex;
exports.objectDirections = objectDirections;
exports.objectEditions = objectEditions;
exports.objectLooks = objectLooks;
exports.objectVariants = objectVariants;
exports.parseObjectVariant = parseObjectVariant;
exports.transferObjectVariant = transferObjectVariant;
