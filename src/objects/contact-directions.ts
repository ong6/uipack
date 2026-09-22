import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Original procedural studies. Contact legacy variants 0–2 stay in scenes.ts.
const C = { cream: 0xf6e9ca, coral: 0xe97c5d, blue: 0x6997ad, green: 0x8bb39b, dark: 0x293f49, gold: 0xbe965c };
const tau = Math.PI * 2;
const v = (x: number, y: number, z = 0) => new T.Vector3(x,y,z);
function mesh(g: T.Object3D, geo: T.BufferGeometry, color: number, x=0,y=0,z=0, metal=false) {
  const m=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:metal?.28:.65,metalness:metal?.65:.02}));
  m.position.set(x,y,z);g.add(m);return m;
}
function box(g: T.Object3D,w: number,h: number,d: number,color: number,x=0,y=0,z=0) {
  return mesh(g,new RoundedBoxGeometry(w,h,d,2,Math.min(.09,w/4,h/4,d/4)),color,x,y,z);
}
function rod(g: T.Object3D,a: T.Vector3,b: T.Vector3,color=C.gold,r=.018) {
  const delta=b.clone().sub(a),m=mesh(g,new T.CylinderGeometry(r,r,delta.length(),12),color,0,0,0,true);
  m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(v(0,1),delta.normalize());return m;
}
function sphere(g: T.Object3D,r: number,color: number,x=0,y=0,z=0) {return mesh(g,new T.SphereGeometry(r,24,16),color,x,y,z);}
function envelope(parent: T.Object3D,color=C.cream) {
  const g=new T.Group();parent.add(g);
  box(g,.64,.43,.07,color);
  for(const z of [-.041,.041]) {
    rod(g,v(-.28,.17,z),v(0,-.025,z),C.gold,.009);
    rod(g,v(0,-.025,z),v(.28,.17,z),C.gold,.009);
  }
  return g;
}
export function createContactDirection(variant: 3|4) {
  const g=new T.Group(), ticks: ((angle:number)=>void)[]=[];
  if(variant===3) {
    const world=new T.Group();g.add(world);world.rotation.set(.35,-.38,0);world.position.y=-.57;
    box(world,2.7,.28,2.05,C.cream,0,-.35);
    box(world,2.6,.07,1.95,0xbaceac,0,-.17);
    for(let i=0;i<4;i++)box(world,.48,.045,.24,0xe9d5b2,.22,-.1,.48+i*.25);
    box(world,.17,.62,.17,C.cream,0,.15,-.18);
    box(world,.55,.08,.43,C.coral,0,-.12,-.18);
    const mailbox=new T.Group();world.add(mailbox);mailbox.position.set(0,.85,-.18);
    box(mailbox,1.16,.88,.87,C.coral);
    box(mailbox,.99,.72,.045,C.cream,0,0,.455);
    box(mailbox,.72,.11,.02,C.dark,0,.17,.486);
    for(const x of [-.24,.24])sphere(mailbox,.043,C.dark,x,-.10,.49);
    const smile=mesh(mailbox,new T.TorusGeometry(.12,.015,8,24,Math.PI),C.coral,0,-.14,.49);smile.rotation.z=Math.PI;
    const flag=new T.Group();mailbox.add(flag);flag.position.set(.62,-.12,0);
    rod(flag,v(0,0),v(0,.78),C.gold,.025);box(flag,.28,.2,.055,C.blue,.12,.68);
    sphere(flag,.06,C.gold);
    for(const [x,z,s] of [[-.98,-.55,.8],[.97,-.6,.55]]) {
      rod(world,v(x,-.13,z),v(x,.6*s,z),0xa18360,.045);
      sphere(world,.32*s,C.green,x,.72*s,z).scale.y=1.4;
      sphere(world,.24*s,0x63937b,x+.13,.55*s,z);
    }
    const letter=envelope(world);letter.name='arriving-letter';
    // Approach the front slot, shrink inside it, and reset only while invisible.
    ticks.push(a=>{
      const p=a/tau, fly=p > .8 ? (1-p)/.2 : Math.min(1,Math.max(0,(p-.1)/.62));
      const ease=fly*fly*(3-2*fly);
      letter.position.set(-1.0*(1-ease),1.02+.86*Math.sin(Math.PI*fly),.31+1.15*(1-ease));
      letter.rotation.set(.12*(1-ease),-.24*(1-ease),-.22*(1-ease));
      const scale=Math.min(1,Math.max(0,(p-.06)/.08))*Math.min(1,Math.max(0,(.79-p)/.09));
      letter.scale.setScalar(scale*.85);letter.visible=scale>0;
      flag.rotation.z=-.65+.65*Math.sin(Math.PI*Math.min(1,Math.max(0,(p-.55)/.35)));
    });
  } else {
    g.rotation.set(.12,-.2,0);
    mesh(g,new T.CylinderGeometry(.98,1.04,.16,64),C.dark,0,-1.45);
    const rim=mesh(g,new T.TorusGeometry(.98,.022,8,80),C.gold,0,-1.36,0,true);rim.rotation.x=Math.PI/2;
    rod(g,v(0,-1.37,-.3),v(0,1.45,-.3),C.gold,.04);
    const mobile=new T.Group();g.add(mobile);mobile.position.set(0,.95,-.3);
    rod(mobile,v(-1.18,0),v(1.18,0),C.gold,.028);
    sphere(mobile,.09,C.gold);
    for(let i=0;i<3;i++) {
      const hanger=new T.Group();mobile.add(hanger);hanger.position.x=(i-1)*.98;
      const length=[.65,1.05,.48][i];rod(hanger,v(0,0),v(0,-length),C.gold,.009);
      const letter=envelope(hanger,[C.cream,C.blue,C.coral][i]);letter.position.y=-length-.21;
      ticks.push(a=>{hanger.rotation.z=.085*Math.sin(a+i*1.8);letter.rotation.y=.32*Math.sin(a+i);});
    }
    // Ceramic receiving tray and the brass orbit suggest many channels, one inbox.
    box(g,1.25,.10,.78,C.cream,0,-1.23,.16);
    for(const x of [-.59,.59])box(g,.08,.18,.78,C.cream,x,-1.11,.16);
    box(g,1.25,.18,.08,C.cream,0,-1.11,-.2);
    const orbit=new T.Group();g.add(orbit);orbit.rotation.set(.85,.3,0);orbit.position.y=-.05;
    mesh(orbit,new T.TorusGeometry(1.39,.012,8,80),C.gold,0,0,0,true);
    const signal=sphere(orbit,.075,C.gold);
    ticks.push(a=>{mobile.rotation.y=.3+.38*Math.sin(a);mobile.rotation.z=.06*Math.sin(a);signal.position.set(1.39*Math.cos(a),1.39*Math.sin(a),0);});
  }
  g.userData.style=variant===3?'cartoon':'kinetic';g.userData.source='procedural';
  g.userData.loopDuration=12000;g.userData.restTime=3200;
  g.userData.animate=(time:number)=>{
    const progress=((time%12000)+12000)%12000/12000;
    for(const tick of ticks)tick(progress*tau);
    g.userData.phase=variant===3?'letter-delivery':'correspondence-mobile';g.userData.pose=progress;
  };
  return g;
}
