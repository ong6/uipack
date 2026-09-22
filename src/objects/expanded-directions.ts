import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { ObjectKind } from './scenes';

// Original authored studies. Y is up, Z faces the camera. Every tick is periodic in 2π.
type Tick = (angle: number) => void;
const tau = Math.PI * 2;
const V = (x: number, y: number, z = 0) => new T.Vector3(x, y, z);
const C = { cream: 0xf3e3bb, coral: 0xec795b, blue: 0x609abe, mint: 0x80b9a0, ink: 0x26374b, gold: 0xc49b58, white: 0xfaf5e9 };
const standard = (color: number, roughness = .68, metalness = .04) => new T.MeshStandardMaterial({ color, roughness, metalness });
function mesh(parent: T.Object3D, geo: T.BufferGeometry, material: T.Material | number, x = 0, y = 0, z = 0) {
  const m = new T.Mesh(geo, typeof material === 'number' ? standard(material) : material);
  m.position.set(x, y, z); parent.add(m); return m;
}
function block(parent: T.Object3D, w: number, h: number, d: number, material: T.Material | number, x = 0, y = 0, z = 0, radius = .055) {
  return mesh(parent, new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 3, h / 3, d / 3)), material, x, y, z);
}
function sphere(parent: T.Object3D, r: number, material: T.Material | number, x = 0, y = 0, z = 0) {
  return mesh(parent, new T.SphereGeometry(r, 24, 16), material, x, y, z);
}
function ring(parent: T.Object3D, r: number, tube: number, material: T.Material | number, x = 0, y = 0, z = 0) {
  return mesh(parent, new T.TorusGeometry(r, tube, 8, 64), material, x, y, z);
}
function cylinder(parent: T.Object3D, r: number, h: number, material: T.Material | number, x = 0, y = 0, z = 0) {
  return mesh(parent, new T.CylinderGeometry(r, r, h, 40), material, x, y, z);
}
function path(parent: T.Object3D, points: T.Vector3[], color: T.Material | number, radius = .018, closed = false) {
  return mesh(parent, new T.TubeGeometry(new T.CatmullRomCurve3(points, closed), 80, radius, 6, closed), color);
}
function rod(parent: T.Object3D, a: T.Vector3, b: T.Vector3, color: number, radius = .02) {
  const delta = b.clone().sub(a), m = cylinder(parent, radius, delta.length(), color);
  m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(V(0,1), delta.normalize()); return m;
}
function group(parent: T.Object3D, x = 0, y = 0, z = 0) { const g = new T.Group(); g.position.set(x,y,z); parent.add(g); return g; }
function tree(parent: T.Object3D, x: number, z: number, s = 1) {
  const g = group(parent,x,0,z); g.scale.setScalar(s);
  cylinder(g,.065,.55,0x94715c,0,.26);
  sphere(g,.27,C.mint,0,.7).scale.y=1.35;
  sphere(g,.21,0x5e9577,.19,.58); return g;
}
function cloud(parent: T.Object3D, x: number, y: number, z: number) {
  const g=group(parent,x,y,z);
  for(const [dx,dy,r] of [[-.23,0,.22],[0,.08,.3],[.25,0,.21]]) sphere(g,r,C.white,dx,dy).scale.z=.6;
  return g;
}
function roof(parent: T.Object3D, w: number, h: number, d: number, x=0,y=0,z=0) {
  const shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(0,h);shape.lineTo(w/2,0);shape.closePath();
  const geo=new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:2,steps:1});geo.translate(0,0,-d/2);
  return mesh(parent,geo,C.coral,x,y,z);
}
function toyHouse(parent: T.Object3D, x: number, z: number) {
  const h=group(parent,x,0,z);
  block(h,.72,.68,.66,C.cream,0,.34);roof(h,.88,.36,.83,0,.67);
  block(h,.2,.31,.03,C.blue,0,.17,.35);
  for(const side of [-1,1])block(h,.13,.14,.035,C.white,side*.23,.46,.35);
  return h;
}
function cartoon(kind: ObjectKind, ticks: Tick[]) {
  const g=new T.Group(), world=group(g,0,-.48,0);world.rotation.set(.48,-.55,0);
  block(world,2.65,.32,2.16,C.cream,0,-.2,0,.16);
  block(world,2.56,.08,2.07,0xb9cfad,0,0,0,.13);
  if(kind==='travel') {
    block(world,2.45,.06,.7,C.blue,0,.055,.55,.2);
    toyHouse(world,-.7,-.45);tree(world,.87,-.56,.85);tree(world,1.04,.03,.55);
    const hill=sphere(world,.61,C.mint,.52,.08,-.62);hill.scale.set(1,1.18,.8);
    const train=group(world,0,.22,.54);
    block(train,.72,.3,.31,C.coral);block(train,.43,.19,.29,C.cream,-.08,.23);
    for(const x of [-.23,.23])for(const z of [-.17,.17])cylinder(train,.095,.04,C.ink,x,-.14,z).rotation.x=Math.PI/2;
    for(const x of [-.2,0])block(train,.13,.11,.015,C.blue,x,.25,.16);
    ticks.push(a=>{train.position.x=.68*Math.sin(a);train.rotation.y=.08*Math.sin(a);});
  } else if(kind==='reading') {
    block(world,1.5,.18,1.48,C.coral,0,.14,0);block(world,1.38,.20,1.37,C.white,0,.32,0);
    for(let i=0;i<4;i++)block(world,1.4,.012,1.38,0xd8c9a5,0,.25+i*.043);
    const seat=group(world,.1,.43,0);block(seat,.66,.13,.59,C.blue,0,.15);block(seat,.67,.7,.16,C.blue,0,.49,-.27,.1);
    for(const x of [-.32,.32])block(seat,.12,.24,.61,C.blue,x,.32);
    const book=group(seat,0,.47,.13);block(book,.43,.05,.34,C.cream);book.rotation.x=-.2;
    const lamp=group(world,-.86,.06,-.36);rod(lamp,V(0,0),V(0,1.32),C.gold,.045);
    mesh(lamp,new T.ConeGeometry(.28,.34,32),C.coral,0,1.35);sphere(lamp,.1,0xffd983,0,1.2);
    tree(world,.93,.5,.68);
    ticks.push(a=>{book.rotation.z=.06*Math.sin(a);seat.rotation.y=.06*Math.sin(a);});
  } else if(kind==='tennis') {
    block(world,1.78,.05,1.8,0x65a78a,0,.075);
    for(const x of [-.74,.74])block(world,.024,.012,1.55,C.white,x,.11);
    for(const z of [-.78,0,.78])block(world,1.5,.012,.024,C.white,0,.11,z);
    for(const x of [-.88,.88])cylinder(world,.035,.43,C.white,x,.28);
    block(world,1.78,.28,.025,C.ink,0,.33);
    for(let i=-8;i<=8;i++)block(world,.012,.26,.03,C.cream,i*.1,.33);
    const ball=sphere(world,.12,0xe5dd70), a=group(world,-.33,.16,.67),b=group(world,.33,.16,-.67);
    for(const [r,color] of [[a,C.coral],[b,C.blue]] as const) {
      cylinder(r,.17,.09,color);sphere(r,.17,color,0,.18).scale.y=.45;ring(r,.19,.032,C.cream,0,.25).rotation.x=-Math.PI/2;
    }
    ticks.push(t=>{const q=Math.sin(t);ball.position.set(.33*q,.53+.51*(1-q*q),-.67*q);a.rotation.y=.22*Math.cos(t);b.rotation.y=-.22*Math.cos(t);});
    tree(world,1.02,-.75,.75);
  } else if(kind==='ai') {
    block(world,1.6,.14,.85,0xc79976,0,.63);for(const x of [-.63,.63])block(world,.1,.59,.1,C.cream,x,.29);
    const bot=group(world,-.26,.98,-.1);block(bot,.81,.62,.34,C.blue,0,0,0,.14);block(bot,.62,.35,.045,C.ink,0,.035,.19,.09);
    for(const x of [-.16,.16])sphere(bot,.055,0xf5dc87,x,.06,.23);
    rod(bot,V(0,.3),V(0,.49),C.coral);sphere(bot,.075,C.coral,0,.54);
    block(world,.66,.045,.28,C.cream,-.22,.73,.28);
    const mug=cylinder(world,.13,.23,C.coral,.58,.81,.15);ring(mug,.1,.025,C.coral,.14,0).rotation.y=.2;
    tree(world,1,-.7,.78);
    ticks.push(a=>{bot.rotation.z=.06*Math.sin(a);bot.position.y=.98+.035*(1-Math.cos(a*2));});
  } else if(kind==='server') {
    for(let i=0;i<3;i++) {
      const building=group(world,-.72+i*.69,0,-.15+(i%2)*.28), height=.87+(i%2)*.38;
      block(building,.58,height,.66,[C.blue,C.coral,C.mint][i],0,height/2);
      for(let j=0;j<3;j++){block(building,.4,.11,.04,C.cream,0,.18+j*.22,.35);sphere(building,.024,0x5ea49f,-.12,.18+j*.22,.38);}
      const fan=ring(building,.17,.04,C.ink,0,height-.15,.35);
      for(let n=0;n<4;n++){const blade=block(fan,.045,.2,.025,C.white);blade.rotation.z=n*Math.PI/2;}
      ticks.push(a=>fan.rotation.z=a*2);
    }
    const puff=cloud(world,.1,1.65,-.16);puff.scale.setScalar(.75);ticks.push(a=>puff.position.y=1.65+.055*Math.sin(a));
  } else {
    for(let i=0;i<5;i++) {
      const h=[.48,.83,1.2,.73,.99][i],x=-.91+i*.46;
      block(world,.35,h,.62,i===3?C.coral:C.blue,x,h/2,-.23);
      for(let j=0;j<Math.floor(h/.22);j++)for(const dx of [-.09,.09])block(world,.075,.1,.018,C.cream,x+dx,.17+j*.21,.09);
    }
    const tram=group(world,0,.2,.59);block(tram,.6,.23,.29,C.coral);block(tram,.35,.12,.25,C.cream,0,.17);
    ticks.push(a=>tram.position.x=.85*Math.sin(a));
  }
  if(kind!=='server') { const puff=cloud(g,.75,1.24,-.65);puff.scale.setScalar(.68);ticks.push(a=>{puff.position.x=.75+.12*Math.sin(a);}); }
  ticks.push(a=>world.rotation.y=-.55+.065*Math.sin(a));
  g.scale.setScalar(.98);return g;
}

function grain() {
  const size=64,data=new Uint8Array(size*size*4);let seed=17;
  for(let i=0;i<size*size;i++){seed=(seed*1664525+1013904223)>>>0;const value=160+(seed%80);data.set([value,value,value,255],i*4);}
  const texture=new T.DataTexture(data,size,size);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(6,6);texture.needsUpdate=true;return texture;
}
function realistic(kind: ObjectKind, ticks: Tick[]) {
  const g=new T.Group(), texture=grain();
  const steel=standard(0x9ba5aa,.28,.82), graphite=standard(0x242d32,.52,.3), paper=standard(0xf0e4cd,.95), leather=standard(0x834934,.84);
  for(const m of [steel,graphite,paper,leather])m.roughnessMap=texture;
  // Shared ownership: one texture is explicitly released with the model.
  g.userData.dispose=()=>texture.dispose();
  const stage=group(g);stage.rotation.set(.48,-.3,-.06);
  block(stage,2.95,.10,2.05,standard(0xc9c1b3,.95),0,-.84,0,.035);
  if(kind==='ai') {
    const keyboard=group(stage,0,-.48,.16);block(keyboard,2.5,.25,1.2,graphite);
    for(let row=0;row<3;row++)for(let col=0;col<8;col++) {
      const key=block(keyboard,.25,.16,.27,(col===7?leather:paper),-1.04+col*.296,.17,-.4+row*.34,.035);
      block(key,.07,.006,.025,col===7?paper:graphite,-.055,.083,-.04,.002);
      const phase=(row*8+col)/24*tau;
      ticks.push(a=>key.position.y=.17-.055*Math.max(0,Math.cos(a-phase))**18);
    }
    const cable=path(stage,[V(1,-.42,-.49),V(1.3,-.27,-.9),V(.5,-.13,-1),V(-.5,-.1,-.78)],graphite,.037);
    cable.rotation.y=.02;
    const cap=group(stage,.36,.67,.05);block(cap,.64,.32,.64,paper,0,.09,.0,.09);block(cap,.3,.16,.3,leather,0,-.17);
    ticks.push(a=>{cap.position.y=.67+.09*Math.sin(a);cap.rotation.y=.25+.12*Math.sin(a);});
  } else if(kind==='tennis') {
    const felt=standard(0xc2c843,.99);felt.roughnessMap=texture;
    const ball=sphere(stage,.57,felt,-.5,-.2,.15);
    const seamPoints=Array.from({length:97},(_,i)=>{const a=i/96*tau;return V(.567*Math.cos(a),.567*Math.sin(a)*Math.cos(.5*Math.cos(a*2)),.567*Math.sin(a)*Math.sin(.5*Math.cos(a*2)));});
    path(ball,seamPoints,paper,.015,true);
    const r=group(stage,.57,.22,-.1);r.rotation.set(.3,-.2,-.43);
    const hoop=ring(r,.57,.043,graphite,0,.22);hoop.scale.y=1.24;ring(r,.533,.012,steel,0,.22).scale.y=1.24;
    for(let i=-5;i<=5;i++) {const x=i*.085,dy=Math.sqrt(.52**2-x*x)*1.24;rod(r,V(x,.22-dy,.015),V(x,.22+dy,.015),0xc0bda9,.004);const y=i*.108,dx=Math.sqrt(.52**2-(y/1.24)**2);rod(r,V(-dx,.22+y,.017),V(dx,.22+y,.017),0xc0bda9,.004);}
    rod(r,V(-.23,-.37),V(0,-.7),0x353f44,.026);rod(r,V(.23,-.37),V(0,-.7),0x353f44,.026);
    block(r,.14,.48,.13,leather,0,-.91);
    for(let i=0;i<8;i++)ring(r,.081,.006,graphite,0,-.71-i*.05).rotation.x=Math.PI/2;
    block(stage,2.6,.009,.025,paper,0,-.775,.59,.002);
    ticks.push(a=>ball.rotation.set(.08*Math.sin(a),a,0));
  } else if(kind==='travel') {
    const compass=group(stage,-.18,-.69,.1);compass.rotation.x=-Math.PI/2;
    cylinder(compass,.85,.14,steel).rotation.x=Math.PI/2;
    cylinder(compass,.77,.02,paper,0,0,.09).rotation.x=Math.PI/2;
    ring(compass,.78,.033,graphite,0,0,.105);
    for(let i=0;i<48;i++){const a=i*tau/48;const mark=block(compass,.014,i%4===0?.12:.05,.012,graphite,.67*Math.sin(a),.67*Math.cos(a),.12,.002);mark.rotation.z=-a;}
    const needle=group(compass,0,0,.15);
    const shape=new T.Shape();shape.moveTo(-.1,0);shape.lineTo(0,.57);shape.lineTo(.1,0);shape.lineTo(0,-.45);shape.closePath();
    mesh(needle,new T.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:false}),leather);sphere(compass,.055,steel,0,0,.21);
    ring(compass,.17,.033,steel,0,1.01,.03);
    for(let i=0;i<8;i++)path(stage,Array.from({length:20},(_,j)=>{const x=-1.32+j*.14;return V(x,-.775,-.8+i*.21+.065*Math.sin(x*4+i));}),0x9baf93,.005);
    ticks.push(a=>needle.rotation.z=.32+.24*Math.sin(a)*(.75+.25*Math.cos(a)));
  } else if(kind==='reading') {
    for(let i=0;i<2;i++) {
      const book=group(stage,-.18+i*.15,-.58+i*.31,0);book.rotation.y=i?-.13:.08;
      block(book,1.85,.055,1.22,i?graphite:leather,0,-.12);block(book,1.77,.2,1.15,paper);block(book,1.85,.055,1.22,i?graphite:leather,0,.12);
      for(let n=0;n<7;n++)block(book,1.77,.006,1.15,0xc7bda8,0,-.077+n*.023,.005,.001);
    }
    const glasses=group(stage,0,.08,.05);glasses.rotation.x=-Math.PI/2;
    for(const x of [-.39,.39]){ring(glasses,.3,.019,steel,x,0);rod(glasses,V(x+Math.sign(x)*.28,0),V(x+Math.sign(x)*.27,.62,-.04),0x747778,.016);}
    path(glasses,[V(-.09,0),V(0,.055),V(.09,0)],steel,.018);
    const bookmark=block(stage,.17,.018,.9,leather,.65,-.05,.44);bookmark.rotation.y=.09;
    ticks.push(a=>stage.rotation.z=-.06+.025*Math.sin(a));
  } else if(kind==='server') {
    const board=group(stage,0,-.57,0);block(board,2.35,.08,1.45,standard(0x345d4c,.7));
    for(let i=0;i<12;i++)block(board,.014,.005,1.15,steel,-1.05+i*.19,.047);
    for(const x of [-.65,.55]) {
      const fan=group(board,x,.23,0);cylinder(fan,.44,.13,graphite);ring(fan,.405,.018,steel).rotation.x=Math.PI/2;
      const rotor=group(fan,0,.08,0);for(let j=0;j<7;j++){const blade=block(rotor,.16,.025,.26,graphite,Math.sin(j*tau/7)*.21,0,Math.cos(j*tau/7)*.21);blade.rotation.y=j*tau/7+.5;}cylinder(rotor,.12,.04,steel);
      ticks.push(a=>rotor.rotation.y=a*3);
    }
    for(let i=0;i<9;i++)block(board,.035,.21,.6,steel,-.3+i*.065,.16,-.42);
    for(let i=0;i<10;i++)block(board,.06,.014,.12,standard(C.gold,.3,.8),-.8+i*.17,.05,.72);
    const chip=block(stage,.64,.1,.64,steel,0,.77,-.08);block(chip,.43,.012,.43,graphite,0,.06);ticks.push(a=>{chip.position.y=.77+.08*Math.sin(a);chip.rotation.y=.15*Math.sin(a);});
  } else {
    const roll=group(stage,-.87,.03,-.1);roll.rotation.z=Math.PI/2;cylinder(roll,.44,.7,paper);cylinder(roll,.13,.71,graphite);
    const tape=group(stage,.27,-.3,.17);tape.rotation.set(-Math.PI/2,0,-.08);block(tape,1.78,.7,.018,paper);
    for(let i=0;i<12;i++){const h=.09+.12*((i*7)%5)/5;block(tape,.035,h,.012,i%3?graphite:leather,-.72+i*.13,.03,.023,.002);block(tape,.006,h+.10,.012,graphite,-.72+i*.13,.03,.018,.001);}
    for(let i=0;i<16;i++)block(tape,.028,.035,.012,graphite,-.75+i*.1,-.23,.023,.001);
    const wheel=ring(stage,.56,.032,steel,-.87,.03,-.1);wheel.rotation.y=Math.PI/2;
    ticks.push(a=>{roll.rotation.x=a;wheel.rotation.x=a;});
  }
  ticks.push(a=>stage.rotation.y=-.3+.07*Math.sin(a));return g;
}

function abstract(kind: ObjectKind, ticks: Tick[]) {
  const g=new T.Group();g.rotation.set(.12,-.25,0);
  const glass=new T.MeshPhysicalMaterial({color:0xa5d8e1,roughness:.12,metalness:.05,transmission:.72,thickness:.6,ior:1.45,clearcoat:1,envMapIntensity:1.2});
  const amber=new T.MeshPhysicalMaterial({color:0xeaa466,roughness:.16,metalness:.05,transmission:.55,thickness:.5,ior:1.4,clearcoat:1});
  const chrome=standard(0xa8b8c9,.18,.86), cobalt=standard(0x435aca,.32,.25);
  if(kind==='ai') {
    const lattice=group(g);lattice.rotation.set(.35,.5,.25);
    for(let i=0;i<3;i++){const hoop=ring(lattice,.84+i*.18,.09,i===1?glass:chrome);hoop.rotation.set(i*.8,i*.6,.2);ticks.push(a=>hoop.rotation.z=a*(i%2?1:-1));}
    mesh(lattice,new T.OctahedronGeometry(.49),amber);
    for(let i=0;i<6;i++){const dot=sphere(g,.105,cobalt);ticks.push(a=>{const q=a+i*tau/6;dot.position.set(1.4*Math.cos(q),.85*Math.sin(q),.4*Math.sin(q*2));});}
  } else if(kind==='tennis') {
    const pair=[group(g,-1,0),group(g,1,0)];
    for(let i=0;i<2;i++){const hoop=ring(pair[i],.64,.14,i?glass:amber);hoop.scale.y=1.42;pair[i].rotation.y=(i?1:-1)*.35;}
    const ball=sphere(g,.27,cobalt);
    const arc=path(g,Array.from({length:49},(_,i)=>{const t=i/48*tau;return V(1.16*Math.sin(t),.65*Math.cos(t),.5*Math.sin(t*2));}),chrome,.015,true);
    ticks.push(a=>{ball.position.set(1.16*Math.sin(a),.65*Math.cos(a),.5*Math.sin(a*2));pair[0].scale.x=1-.10*Math.max(0,-Math.sin(a))**8;pair[1].scale.x=1-.10*Math.max(0,Math.sin(a))**8;arc.rotation.y=.04*Math.sin(a);});
  } else if(kind==='trading') {
    for(let i=0;i<7;i++) {
      const h=.7+((i*3)%5)*.22;
      const bar=block(g,.27,h,.42,i%3===0?amber:i%2===0?glass:cobalt,-1.17+i*.39,0,0,.12);
      rod(g,V(-1.17+i*.39,-1.3),V(-1.17+i*.39,1.3),0xa8b8c9,.009);
      ticks.push(a=>bar.position.y=.36*Math.sin(a+i*.62));
    }
    const brace=ring(g,1.53,.016,chrome);brace.scale.y=.82;brace.rotation.x=.4;
  } else if(kind==='server') {
    for(let i=0;i<5;i++) {
      const slab=block(g,1.65,.14,1.03,i%2?glass:chrome,0,-1.03+i*.51,0,.06);
      const core=block(slab,.5,.11,.4,i%2?cobalt:amber,0,.13,0,.045);
      ticks.push(a=>{slab.rotation.y=.35*Math.sin(a+i*.55);core.rotation.y=-.35*Math.sin(a+i*.55);});
    }
    for(const x of [-.98,.98])path(g,[V(x,-1.2),V(x*1.22,-.5,.2),V(x*1.22,.5,-.2),V(x,1.2)],cobalt,.03);
  } else if(kind==='travel') {
    for(let i=0;i<4;i++) {
      const portal=ring(g,1.06-i*.1,.12,i%2?glass:amber,-.48+i*.32,0,-.7+i*.43);
      portal.scale.y=1.18;portal.rotation.y=-.4;
      ticks.push(a=>portal.rotation.z=.2*Math.sin(a+i*.4));
    }
    const journey=sphere(g,.16,cobalt);ticks.push(a=>journey.position.set(1.37*Math.cos(a),.75*Math.sin(a),.7*Math.sin(a)));
    path(g,Array.from({length:65},(_,i)=>{const a=i/64*tau;return V(1.37*Math.cos(a),.75*Math.sin(a),.7*Math.sin(a));}),chrome,.014,true);
  } else {
    // Individual curved leaves form an open, breathing ribbon sculpture.
    for(let i=0;i<7;i++) {
      const points=Array.from({length:33},(_,j)=>{const t=j/32;return V((t-.5)*2.2,Math.sin(t*Math.PI)*.8,0);});
      const ribbon=new T.Shape();ribbon.moveTo(-1.1,0);for(let j=1;j<33;j++)ribbon.lineTo(points[j].x,points[j].y);for(let j=32;j>=0;j--)ribbon.lineTo(points[j].x,points[j].y-.05);ribbon.closePath();
      const geo=new T.ExtrudeGeometry(ribbon,{depth:.55,bevelEnabled:true,bevelThickness:.015,bevelSize:.012,bevelSegments:2,steps:1});geo.translate(0,0,-.275);
      const leaf=mesh(g,geo,i%3===0?glass:i%2?chrome:amber,0,-1.12+i*.27,(i-3)*.11);leaf.rotation.y=.4;
      ticks.push(a=>{leaf.rotation.z=.08*Math.sin(a+i*.38);leaf.position.y=-1.12+i*.27+.045*Math.sin(a+i*.38);});
    }
  }
  ticks.push(a=>g.rotation.y=-.25+.12*Math.sin(a));return g;
}
export function createExpandedDirection(kind: ObjectKind, variant: 3|4|5) {
  const ticks: Tick[]=[];
  const object=variant===3?cartoon(kind,ticks):variant===4?realistic(kind,ticks):abstract(kind,ticks);
  object.userData.style=['cartoon','realistic','abstract'][variant-3];
  object.userData.source='procedural';object.userData.loopDuration=12000;object.userData.restTime=1800;
  object.userData.animate=(time:number)=>{const p=((time%12000)+12000)%12000/12000;for(const tick of ticks)tick(p*tau);object.userData.phase=`${object.userData.style}-study`;object.userData.pose=p;};
  return object;
}
