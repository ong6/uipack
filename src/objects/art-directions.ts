import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createExpandedDirection } from './expanded-directions';
import type { ObjectKind, ObjectPalette } from './scenes';

/** Original procedural models. Coordinates are authored for the existing orthographic player. */
export const directionTokens = {
  paper: { cream: 0xffe8bd, peach: 0xe9a278, coral: 0xbe563f, blue: 0x587d91, teal: 0x366e68, ink: 0x343e51 },
  kinetic: { ivory: 0xf3e7cc, gold: 0xbc9152, dark: 0x263849, blue: 0x658b99, orange: 0xc16c46 },
};
type Tick = (angle: number) => void;
const tau = Math.PI * 2;
const material = (color: number, metal = false) => new T.MeshStandardMaterial({ color, roughness: metal ? .3 : .87, metalness: metal ? .55 : .02 });
function add(g: T.Object3D, geometry: T.BufferGeometry, color: number, x = 0, y = 0, z = 0, metal = false) {
  const m = new T.Mesh(geometry, material(color, metal)); m.position.set(x, y, z); g.add(m); return m;
}
function box(g: T.Object3D, w: number, h: number, d: number, color: number, x = 0, y = 0, z = 0) {
  return add(g, new RoundedBoxGeometry(w, h, d, 1, Math.min(.018,w/4,h/4,d/4)), color, x, y, z);
}
function ball(g: T.Object3D, r: number, color: number, x = 0, y = 0, z = 0, metal = false) {
  return add(g, new T.SphereGeometry(r, 24, 16), color, x, y, z, metal);
}
function disc(g: T.Object3D, r: number, depth: number, color: number, x = 0, y = 0, z = 0) {
  const m = add(g, new T.CylinderGeometry(r, r, depth, 64), color, x, y, z); m.rotation.x = Math.PI / 2; return m;
}
function ring(g: T.Object3D, r: number, width: number, color: number, x = 0, y = 0, z = 0, metal = false) {
  return add(g, new T.TorusGeometry(r, width, 10, 80), color, x, y, z, metal);
}
function cut(g: T.Object3D, points: number[][], color: number, z = 0, depth = .065) {
  const s = new T.Shape(); points.forEach(([x,y], i) => i ? s.lineTo(x,y) : s.moveTo(x,y)); s.closePath();
  return add(g, new T.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: .006, bevelSize: .008, bevelSegments: 1, steps: 1 }), color, 0, 0, z);
}
function curve(g: T.Object3D, points: T.Vector3[], color: number, radius = .018) {
  return add(g, new T.TubeGeometry(new T.CatmullRomCurve3(points), 64, radius, 6, false), color);
}
function rod(g: T.Object3D, a: T.Vector3, b: T.Vector3, color: number, radius = .015) {
  const d = b.clone().sub(a); const m = add(g, new T.CylinderGeometry(radius, radius, d.length(), 8), color);
  m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0), d.normalize()); return m;
}
const v = (x: number,y: number,z=0) => new T.Vector3(x,y,z);
function paperTree(g: T.Group, x: number, y: number, z: number, s = 1) {
  const t = new T.Group(); t.position.set(x,y,z); t.scale.setScalar(s); g.add(t);
  box(t,.045,.6,.08,0x7c5945,0,.18);
  cut(t,[[-.28,.24],[0,.91],[.28,.24]],directionTokens.paper.teal,.02);
  cut(t,[[-.22,.5],[0,1.08],[.22,.5]],0x659585,.07);
  return t;
}
function plane(g: T.Group, color: number) {
  const a = new T.Group();
  cut(a,[[0,.32],[-.28,-.18],[0,-.06],[.28,-.18]],color,0,.04);
  cut(a,[[0,.32],[-.045,-.23],[.045,-.23]],0xfff7e5,.045,.03);
  g.add(a); return a;
}
function racket(g: T.Group, color: number, metal = false) {
  const a = new T.Group(); g.add(a);
  const hoop = ring(a,.47,.038,color,0,.2,0,metal); hoop.scale.y=1.25;
  for(let i=-3;i<=3;i++) {
    const x=i*.105, y=i*.135;
    const dy=Math.sqrt(.44**2-x*x)*1.25;
    rod(a,v(x,.2-dy,.01),v(x,.2+dy,.01),0xb5b9ab,.006);
    const dx=Math.sqrt(Math.max(0,.44**2-(y/1.25)**2));
    rod(a,v(-dx,.2+y,.012),v(dx,.2+y,.012),0xb5b9ab,.006);
  }
  rod(a,v(-.2,-.32),v(0,-.66),color,.023);rod(a,v(.2,-.32),v(0,-.66),color,.023);
  box(a,.12,.47,.12,0x394a4b,0,-.86);
  for(let i=0;i<6;i++)box(a,.127,.013,.126,0x7b8985,0,-.68-i*.062);
  return a;
}
function paperWorld(kind: ObjectKind, c: ObjectPalette, ticks: Tick[]) {
  const g = new T.Group(), C = directionTokens.paper;
  // A real layered stage: each silhouette has thickness and a separate depth plane.
  disc(g,1.74,.14,C.peach,0,0,-.45);
  disc(g,1.6,.08,C.cream,0,0,-.34);
  const halo=ring(g,1.68,.035,C.coral,0,0,-.28);
  halo.scale.y=1.02;
  if(kind==='travel') {
    disc(g,.34,.045,C.coral,.78,.88,-.2);
    cut(g,[[-1.53,-.54],[-.93,.9],[-.27,-.05],[.28,.77],[1.51,-.55],[1.25,-1.05],[-1.25,-1.05]],C.blue,-.11);
    cut(g,[[-1.45,-.65],[-.62,.38],[.13,-.21],[.9,.48],[1.46,-.62],[1.16,-1.15],[-1.16,-1.15]],C.teal,.17);
    cut(g,[[-1.25,-1.02],[-.91,-.48],[-.18,-.77],[.57,-.44],[1.24,-.97],[.74,-1.42],[-.64,-1.42]],0x91ad8d,.43);
    curve(g,[v(-.83,-1.04,.52),v(-.17,-.75,.53),v(.12,-.46,.28),v(.54,-.35,.25)],C.cream,.055);
    paperTree(g,-.89,-.82,.5,.55);paperTree(g,.9,-.87,.49,.4);
    const flyer=plane(g,C.cream);flyer.scale.setScalar(.65);
    ticks.push(a=>{flyer.position.set(Math.cos(a)*1.25,.92+Math.sin(a)*.21,.6+Math.sin(a)*.12);flyer.rotation.z=Math.atan2(.21*Math.cos(a),-1.25*Math.sin(a))-Math.PI/2;});
  } else if(kind==='reading') {
    const book=new T.Group();g.add(book);book.position.set(0,-.85,.63);book.rotation.x=.65;
    for(const side of [-1,1]) {
      const leaf=new T.Group();book.add(leaf);leaf.rotation.y=side*.14;
      box(leaf,1.25,.14,1.48,C.coral,side*.64,0,0);
      for(let i=0;i<5;i++)box(leaf,1.2,.024,1.4,C.cream,side*.62,.10+i*.032,0);
    }
    // Pop-up architecture springs from the book's gutter; no faux page deformation.
    const portal=new T.Group();portal.position.set(0,-.49,.5);g.add(portal);
    box(portal,.3,1.25,.14,C.blue,-.58,.53);box(portal,.3,1.25,.14,C.blue,.58,.53);
    cut(portal,[[-.84,1.05],[0,1.69],[.84,1.05]],C.coral,.02);
    for(let i=0;i<5;i++)box(g,.78,.10,.22,C.peach,0,-.91+i*.1,1.13-i*.14);
    paperTree(g,-1.04,-.64,.71,.53);paperTree(g,1.06,-.64,.64,.4);
    for(let i=0;i<5;i++) {
      const slip=box(g,.26,.36,.025,i%2?C.blue:C.cream,-1+i*.5,1.03,.32);
      ticks.push(a=>{slip.position.y=1.1+.15*Math.sin(a+i);slip.rotation.z=.2*Math.sin(a+i);slip.rotation.y=.25*Math.cos(a+i);});
    }
    ticks.push(a=>portal.rotation.y=.10*Math.sin(a));
  } else if(kind==='tennis') {
    // Top-down graphic court, floating above the paper disc, with a physically raised net.
    const court=new T.Group();g.add(court);court.rotation.z=-.25;
    box(court,1.83,2.62,.08,C.teal,0,0,.12);
    for(const x of [-.79,-.57,.57,.79])box(court,.014,2.35,.012,C.cream,x,0,.175);
    for(const y of [-1.17,-.57,.57,1.17])box(court,1.58,.015,.012,C.cream,0,y,.175);
    box(court,.014,1.14,.012,C.cream,0,0,.175);
    box(court,1.96,.035,.33,C.ink,0,0,.29);
    for(let i=-12;i<=12;i++)box(court,.012,.018,.31,C.cream,i*.073,-.025,.3);
    const r1=racket(court,C.coral),r2=racket(court,C.peach);r1.scale.setScalar(.43);r2.scale.setScalar(.43);r2.rotation.z=Math.PI;
    r1.position.set(-.34,-1.1,.36);r2.position.set(.34,1.1,.36);
    const b=ball(court,.075,0xf9d260);
    ticks.push(a=>{b.position.set(.34*Math.sin(a),1.02*Math.sin(a),.4+.46*Math.cos(a)**2);r1.rotation.z=.25*Math.cos(a);r2.rotation.z=Math.PI+.25*Math.cos(a);});
  } else if(kind==='ai') {
    // A cut-paper automaton feeding a cascade of physical instruction cards.
    const head=new T.Group();g.add(head);head.position.set(-.54,.14,.47);
    box(head,1.14,.94,.3,C.blue);box(head,.91,.55,.06,C.cream,0,.03,.18);
    for(const x of [-.24,.24])disc(head,.09,.03,C.ink,x,.08,.23);
    box(head,.31,.025,.035,C.coral,0,-.14,.23);
    rod(head,v(0,.47),v(0,.73),C.coral,.028);ball(head,.085,C.coral,0,.78);
    for(let i=0;i<3;i++) {
      const card=new T.Group();g.add(card);card.position.set(.64+i*.15,.23-i*.4,.05+i*.28);card.rotation.z=-.12;
      box(card,.85,.52,.07,[C.peach,C.cream,C.teal][i]);
      for(let j=0;j<3;j++)box(card,.55-j*.08,.025,.01,i===2?C.cream:C.ink,-j*.04,.13-j*.11,.045);
      ticks.push(a=>{card.position.x=.64+i*.15+.06*Math.sin(a+i*.9);card.rotation.y=.14*Math.sin(a+i*.9);});
    }
    cut(g,[[-1.07,-.58],[-.1,-.58],[-.1,-.87],[.1,-.7],[-.1,-.48],[-.1,-.65],[-1.07,-.65]],C.coral,.58);
    ticks.push(a=>{head.rotation.z=.06*Math.sin(a);head.position.y=.14+.06*Math.cos(a);});
  } else if(kind==='server') {
    const tower=new T.Group();g.add(tower);tower.rotation.y=-.35;
    for(let i=0;i<4;i++) {
      const layer=new T.Group();tower.add(layer);layer.position.y=-.94+i*.61;
      box(layer,1.6,.42,.55,[C.blue,C.teal,C.coral,C.blue][i]);
      box(layer,1.38,.25,.025,C.cream,0,0,.29);
      for(let j=0;j<6;j++)box(layer,.075,.12,.024,C.ink,-.5+j*.145,0,.32);
      disc(layer,.042,.03,C.coral,.54,0,.33);
      const tab=cut(layer,[[.8,-.12],[1.02,-.12],[1.02,.12],[.8,.12]],C.peach,-.05);
      ticks.push(a=>{layer.position.x=.12*Math.sin(a+i*.7);tab.rotation.y=.15*Math.sin(a);});
    }
    for(let i=0;i<4;i++) {
      const dot=disc(g,.055,.04,C.coral,-1.18,-.9+i*.55,.1);
      ticks.push(a=>dot.position.y=-.9+i*.55+.06*Math.sin(a+i));
    }
  } else {
    // Price history as a dimensional paper accordion, intentionally labelled a study by the host.
    for(let i=0;i<7;i++) {
      const panel=new T.Group();g.add(panel);panel.position.set(-1.2+i*.39,0,.12+i*.055);panel.rotation.y=(i%2?1:-1)*.2;
      box(panel,.39,1.8,.045,i%2?C.cream:0xf6d7a3);
      const height=[.37,.64,.47,.88,.69,1.02,.87][i];
      box(panel,.15,height,.055,i===2||i===4?C.coral:C.teal,0,-.55+height/2,.065);
      box(panel,.018,height+.26,.045,C.ink,0,-.55+height/2,.05);
      box(panel,.19,.12+(i%3)*.045,.025,C.blue,0,-.74,.08);
      ticks.push(a=>panel.rotation.y=(i%2?1:-1)*(.18+.11*Math.sin(a)));
    }
    curve(g,[v(-1.3,-1.14,.66),v(-.6,-1.02,.66),v(.3,-1.1,.66),v(1.27,-.9,.66)],C.coral,.025);
  }
  ticks.push(a=>{g.rotation.set(-.18+.035*Math.cos(a),-.34+.10*Math.sin(a),-.035);});
  return g;
}
function kineticWorld(kind: ObjectKind, c: ObjectPalette, ticks: Tick[]) {
  const g=new T.Group(), C=directionTokens.kinetic;
  const base=add(g,new T.CylinderGeometry(.93,1.05,.16,64),C.dark,0,-1.49,0);
  base.rotation.x=0;
  ring(g,.96,.012,C.gold,0,-1.48,0,true).rotation.x=Math.PI/2;
  const foot=add(g,new T.CylinderGeometry(.85,.91,.06,64),C.dark,0,-1.59,0);
  ring(g,.94,.018,C.gold,0,-1.4,0,true).rotation.x=Math.PI/2;
  if(kind==='ai') {
    const core=add(g,new T.IcosahedronGeometry(.52,0),C.gold,0,.1,0,true);
    for(let i=0;i<3;i++) {
      const orbit=new T.Group();g.add(orbit);orbit.position.y=.1;orbit.rotation.set(.7+i*.6,i*.8,.3+i*.7);
      ring(orbit,1.2+i*.12,.018,C.gold,0,0,0,true);
      const chip=box(orbit,.3,.3,.12,[C.dark,C.blue,C.orange][i]);
      for(let j=-1;j<=1;j++) {box(chip,.035,.06,.05,C.gold,j*.075,.18);box(chip,.035,.06,.05,C.gold,j*.075,-.18);}
      ticks.push(a=>{const q=a+i*tau/3;chip.position.set(Math.cos(q)*(1.2+i*.12),Math.sin(q)*(1.2+i*.12),0);chip.rotation.z=q;});
    }
    ticks.push(a=>{core.rotation.set(a/1,.5*Math.sin(a),a);});
  } else if(kind==='travel') {
    const globe=new T.Group();g.add(globe);globe.position.y=.08;globe.rotation.z=-.28;
    ball(globe,.83,C.blue);
    for(let i=0;i<6;i++){const r=ring(globe,.85,.009,C.ivory);r.rotation.y=i*Math.PI/6;}
    for(const latitude of [-.5,0,.5]){const r=ring(globe,Math.sqrt(.85**2-latitude**2),.009,C.ivory,0,latitude);r.rotation.x=Math.PI/2;}
    const meridian=ring(g,1.08,.045,C.gold,0,.08,0,true);meridian.rotation.y=.3;meridian.rotation.z=-.28;
    rod(g,v(0,-1.41),v(0,-1),C.gold,.055);
    const orbit=new T.Group();g.add(orbit);orbit.position.y=.08;orbit.rotation.set(.6,-.3,-.35);
    ring(orbit,1.34,.014,C.gold,0,0,0,true);
    const flyer=plane(orbit,C.ivory);flyer.scale.setScalar(.53);
    ticks.push(a=>{globe.rotation.y=a;flyer.position.set(1.34*Math.cos(a),1.34*Math.sin(a),0);flyer.rotation.z=a;});
  } else if(kind==='tennis') {
    const r=racket(g,C.gold,true);r.scale.setScalar(1.17);r.position.set(-.34,.12,.12);r.rotation.set(.15,-.4,-.4);
    const path=new T.Group();g.add(path);path.rotation.set(.65,-.4,-.35);path.position.set(.22,.35,.1);
    ring(path,1.18,.012,C.gold,0,0,0,true);
    const b=ball(path,.19,0xd5d976);ring(b,.189,.008,C.ivory).rotation.y=Math.PI/2;
    ticks.push(a=>{b.position.set(1.18*Math.cos(a),1.18*Math.sin(a),0);b.rotation.z=a*2;r.rotation.y=-.4+.18*Math.sin(a);});
    rod(g,v(-.3,-1.4),v(-.3,-.8),C.gold,.035);
  } else if(kind==='server') {
    const tower=new T.Group();g.add(tower);tower.rotation.set(.4,-.48,0);
    for(let i=0;i<4;i++) {
      const layer=new T.Group();tower.add(layer);
      box(layer,1.4,.10,.95,i%2?C.ivory:C.dark);
      const fan=ring(layer,.28,.024,C.gold,0,.09,0,true);fan.rotation.x=-Math.PI/2;
      for(let blade=0;blade<6;blade++) {const b=box(fan,.12,.23,.025,C.blue,Math.cos(blade*tau/6)*.14,Math.sin(blade*tau/6)*.14);b.rotation.z=blade*tau/6-.4;}
      for(const x of [-.58,.58])for(const z of [-.36,.36])ball(layer,.037,C.gold,x,.08,z,true);
      ticks.push(a=>{layer.position.y=-.91+i*.61+.075*Math.sin(a+i*.65);fan.rotation.z=a*2;});
    }
    for(const x of [-.61,.61])rod(tower,v(x,-1.3,-.4),v(x,1.21,-.4),C.gold,.018);
    ticks.push(a=>tower.rotation.y=-.48+.12*Math.sin(a));
  } else if(kind==='reading') {
    const book=new T.Group();g.add(book);book.name="kinetic-folio";book.rotation.set(.32,-.4,-.15);book.position.y=.12;
    // A suspended fan of individual rigid leaves, each with its own hinge.
    for(let i=0;i<13;i++) {
      const hinge=new T.Group();book.add(hinge);hinge.rotation.y=-1.3+i*.21;
      box(hinge,1.16,1.59,.025,i===0||i===12?C.dark:C.ivory,.59,0,0);
      if(i%3===0&&i>0&&i<12)for(let j=0;j<7;j++)box(hinge,.72,.012,.007,C.gold,.62,.49-j*.15,.017);
      ticks.push(a=>hinge.rotation.y=-1.3+i*.21+.045*Math.sin(a+i*.22));
    }
    rod(book,v(0,-.91),v(0,.91),C.gold,.06);
    const ribbon=curve(g,[v(-.85,-1.03,.3),v(-1.2,-.4,.5),v(-1.05,.5,.2),v(-.48,1.3,-.2),v(.58,1.15,-.4)],C.gold,.022);
    ticks.push(a=>{book.rotation.y=-.4+a;book.rotation.z=-.15+.075*Math.sin(a);ribbon.rotation.y=.15*Math.sin(a);});
  } else {
    // Market balance: candles are hanging weights, not a fabricated live feed.
    rod(g,v(0,-1.4),v(0,.94),C.gold,.045);ball(g,.09,C.gold,0,.94,0,true);
    const beam=new T.Group();g.add(beam);beam.position.y=.94;
    rod(beam,v(-1.2,0),v(1.2,0),C.gold,.037);
    for(const side of [-1,1]) {
      const tray=new T.Group();beam.add(tray);tray.position.x=side*.91;
      for(const x of [-.37,.37])rod(tray,v(0,0),v(x,-.95),C.gold,.012);
      const platter=add(tray,new T.CylinderGeometry(.48,.4,.08,40),C.ivory,0,-1,0);
      for(let i=0;i<3;i++){
        const h=[.32,.57,.43][i];box(tray,.12,h,.12,side<0?C.blue:C.orange,-.22+i*.22,-.92+h/2,0);
        rod(tray,v(-.22+i*.22,-.91),v(-.22+i*.22,-.85+h),C.gold,.009);
      }
      ticks.push(a=>{tray.rotation.z=-.14*Math.sin(a);platter.rotation.y=a;});
    }
    ticks.push(a=>beam.rotation.z=.14*Math.sin(a));
  }
  ticks.push(a=>g.rotation.y=.18+.12*Math.sin(a));
  return g;
}
export function createArtDirection(kind: ObjectKind, palette: ObjectPalette, variant: 1|2|3|4|5) {
  if(variant>=3)return createExpandedDirection(kind,variant as 3|4|5);
  const ticks: Tick[]=[];
  const g=variant===1?paperWorld(kind,palette,ticks):kineticWorld(kind,palette,ticks);
  g.userData.style=variant===1?'paper-theatre':'kinetic';
  g.userData.source='procedural';g.userData.loopDuration=12000;g.userData.restTime=1800;
  g.userData.animate=(time: number)=>{
    const progress=((time%12000)+12000)%12000/12000;
    for(const tick of ticks)tick(progress*tau);
    g.userData.phase=variant===1?'paper-parallax':'kinetic-orbit';g.userData.pose=progress;
  };
  return g;
}
