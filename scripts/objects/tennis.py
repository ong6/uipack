"""Original UI Pack tennis study. Run with Blender --background --python-exit-code 1 --python this.py.
Writes portable GLB + embedded runtime source; editable .blend and previews go to /tmp/uipack-tennis.
No external models, textures or fonts are used. Coordinates: Z up, athlete faces +Y.
"""
import bpy, math, json, base64
from pathlib import Path
from mathutils import Vector, Quaternion
ROOT = Path(__file__).resolve().parents[2]
OUT = Path('/tmp/uipack-tennis'); OUT.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene; scene.render.fps=30; scene.frame_start=0; scene.frame_end=180

def material(name, hex, rough=.65):
    rgb=tuple(int(hex[i:i+2],16)/255 for i in (0,2,4)); linear=tuple(((v+.055)/1.055)**2.4 if v>.04045 else v/12.92 for v in rgb)
    m=bpy.data.materials.new(name); m.diffuse_color=(*linear,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*linear,1); p.inputs['Roughness'].default_value=rough
    return m
skin=material('Skin','b88160'); shirt=material('Jersey','eee9db'); trim=material('Kit accent','27534a'); navy=material('Shorts','283e48'); white=material('Shoe','eeeada'); sole=material('Sole','b5c3b5'); hair=material('Hair','322c28'); courtmat=material('Court','326658'); border=material('Court surround','284c43'); chalk=material('Court lines','ced5b7'); string=material('Strings','b9c4aa'); rubber=material('Grip','29362f'); ballmat=material('Ball','ddec56')

def finish(o,name,mat):
    o.name=name; o.data.materials.append(mat)
    for p in o.data.polygons:p.use_smooth=True
    return o

def ell(name,loc,scale,mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,location=loc); o=finish(bpy.context.object,name,mat);o.scale=scale;return o

def box(name,loc,size,mat,bevel=.04):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=finish(bpy.context.object,name,mat);o.scale=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    b=o.modifiers.new('Soft manufactured edges','BEVEL');b.width=bevel;b.segments=3
    bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=b.name)
    o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');return o

def path(name,points,r,mat,cyclic=False):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=1;c.bevel_depth=r;c.bevel_resolution=2
    p=c.splines.new('POLY');p.points.add(len(points)-1)
    for v,co in zip(p.points,points):v.co=(*co,1)
    p.use_cyclic_u=cyclic;o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(mat);return o

def loft(name,rings,mat):
    verts=[]; faces=[];n=24
    for z,rx,ry in rings:
        for i in range(n):
            a=2*math.pi*i/n;verts.append((rx*math.cos(a),ry*math.sin(a),z))
    for j in range(len(rings)-1):
        for i in range(n):faces.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    faces.extend([tuple(reversed(range(n))),tuple((len(rings)-1)*n+i for i in range(n))])
    m=bpy.data.meshes.new(name);m.from_pydata(verts,[],faces);m.update();o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o);return finish(o,name,mat)

def empty(name):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);return o

def parent(o,p):o.parent=p;return o

def key(o,f):
    o.keyframe_insert('location',frame=f);o.keyframe_insert('rotation_quaternion' if o.rotation_mode=='QUATERNION' else 'rotation_euler',frame=f)

def segment(name,length,r1,r2,mat):
    o=loft(name,[(0,r1*.8,r1*.8),(.035,r1,r1),(length*.35,r1*.97,r1*.97),(length*.8,r2,r2),(length,r2*.8,r2*.8)],mat);o.rotation_mode='QUATERNION';return o

def aim(o,a,b):
    o.location=a;o.rotation_quaternion=Vector((0,0,1)).rotation_difference(Vector(b)-Vector(a))

# Full court, one net, players on opposite sides.
box('Court base',(0,0,-.075),(4.28,7,.15),border,.09)
box('Court playing surface',(0,0,.01),(3.92,6.65,.025),courtmat,.04)
for x in [-1.63,1.63]:path('Sideline',[(x,-3.05,.03),(x,3.05,.03)],.012,chalk)
for y in [-3.05,-1.15,1.15,3.05]:path('Baseline', [(-1.63,y,.03),(1.63,y,.03)],.012,chalk)
path('Service divider',[(0,-1.15,.03),(0,1.15,.03)],.01,chalk)
for x in [-1.83,1.83]:box('Net post',(x,0,.40),(.065,.065,.78),rubber,.016)
for i in range(27):
    x=-1.8+i*3.6/26;h=.68+.035*(abs(x)/1.8)**2
    path('Net vertical',[(x,0,.10),(x,0,h)],.004,string)
for i in range(6):path('Net horizontal',[(-1.8,0,.12+i*.10),(1.8,0,.12+i*.10)],.004,string)
path('Net tape',[(-1.84+i*3.68/30,0,.68+.035*(abs(-1.84+i*3.68/30)/1.84)**2) for i in range(31)],.021,shirt)

# Cohesive cloth silhouette and detailed kit. Empty joints make the baked animation editable.
body=empty('Athlete torso')
jersey=parent(loft('Tailored jersey',[(0,.29,.18),(.07,.31,.195),(.25,.32,.2),(.48,.385,.215),(.62,.405,.21),(.70,.31,.18),(.76,.12,.12)],shirt),body)
parent(path('Jersey hem',[(.295*math.cos(a),.185*math.sin(a),.04) for a in [i*2*math.pi/48 for i in range(48)]],.013,trim,True),body)
parent(ell('Neck',(0,0,.79),(.09,.095,.14),skin),body)
parent(ell('Head',(0,.01,1.04),(.188,.17,.25),skin),body)
parent(ell('Nose',(0,.183,1.025),(.039,.043,.048),skin),body)
for eye_x in [-.07,.07]:parent(ell('Eye',(eye_x,.166,1.09),(.016,.012,.016),hair),body)
parent(ell('Cropped hair',(0,-.018,1.14),(.197,.171,.18),hair),body)
for x in [-.182,.182]:parent(ell('Ear',(x,.016,1.03),(.035,.042,.069),skin),body)
# Headband and rear shirt graphic use geometry, avoiding texture requests.
parent(path('Headband',[(.191*math.cos(a),.17*math.sin(a),1.13) for a in [i*2*math.pi/48 for i in range(48)]],.017,shirt,True),body)
for z,w in [(.5,.09),(.44,.15),(.38,.09)]:parent(box('Back kit stripe',(0,-.216,z),(w,.006,.019),trim,.005),body)
hips=empty('Athlete pelvis')
parent(loft('Shorts waist',[(0,.29,.18),(.16,.30,.18),(.25,.285,.17)],navy),hips)
parts={}; joints={}; shoes={}
for side in [-1,1]:
    tag='Left' if side<0 else 'Right'
    parts[tag+'upper']=segment(tag+' sleeve',.36,.14,.112,shirt)
    parts[tag+'fore']=segment(tag+' forearm',.37,.092,.065,skin)
    joints[tag+'elbow']=ell(tag+' elbow',(0,0,0),(.09,.09,.095),skin)
    joints[tag+'hand']=ell(tag+' hand',(0,0,0),(.071,.085,.095),skin)
    parts[tag+'thigh']=segment(tag+' thigh',.52,.145,.103,skin)
    parts[tag+'short']=segment(tag+' shorts leg',.27,.19,.175,navy)
    parts[tag+'shin']=segment(tag+' calf',.49,.104,.067,skin)
    joints[tag+'knee']=ell(tag+' knee',(0,0,0),(.104,.10,.10),skin)
    shoes[tag]=empty(tag+' sneaker')
    parent(box(tag+' outsole',(0,.07,.06),(.23,.43,.095),sole,.035),shoes[tag])
    parent(ell(tag+' shoe upper',(0,.07,.11),(.118,.205,.108),white),shoes[tag])
    parent(box(tag+' heel tab',(0,-.11,.18),(.095,.045,.07),trim,.012),shoes[tag])
    for i in range(3):parent(path(tag+' lace',[(-.06,.02+i*.045,.20),(.06,.02+i*.045,.20)],.007,sole),shoes[tag])
    parts[tag+'sock']=segment(tag+' sock',.17,.074,.079,white)
# Racket face lies in XZ; grip origin at wrist, head center is 0.63 along local Z.
racket=empty('Racket');racket.rotation_mode='QUATERNION'
parent(path('Racket rim',[(.245*math.cos(a),0,.63+.335*math.sin(a)) for a in [i*2*math.pi/64 for i in range(64)]],.025,trim,True),racket)
parent(path('Racket throat',[(-.12,0,.35),(0,0,.19),(.12,0,.35)],.018,trim),racket)
parent(segment('Racket grip',.24,.037,.032,rubber),racket)
for i in range(-4,5):
    x=i*.043; h=.308*math.sqrt(1-(x/.225)**2)
    parent(path('Racket string',[(x,0,.63-h),(x,0,.63+h)],.003,string),racket)
    z=i*.058;w=.225*math.sqrt(1-(z/.308)**2)
    parent(path('Racket string',[(-w,0,.63+z),(w,0,.63+z)],.003,string),racket)
# Duplicate authored geometry before baking, with separate transforms and a contrasting kit.
near=empty('Near player');near.location=(0,-2,0);near.scale=(.72,)*3
far=empty('Far player');far.location=(0,2,0);far.scale=(.72,)*3;far.rotation_euler.z=math.pi
far_shirt=material('Opponent jersey','789b9a')
roots=[body,hips,racket,*parts.values(),*joints.values(),*shoes.values()]
copies={}
def duplicate_tree(o,p):
    copy=o.copy();copy.name='Far '+o.name;bpy.context.collection.objects.link(copy);copy.parent=p;copies[o]=copy
    if o.type=='MESH' and any(m==shirt for m in o.data.materials):
        copy.data=o.data.copy()
        for i,m in enumerate(copy.data.materials):
            if m==shirt:copy.data.materials[i]=far_shirt
    for child in list(o.children):duplicate_tree(child,copy)
for o in roots:
    duplicate_tree(o,far);o.parent=near
ball=ell('Tennis ball',(0,0,1),(.073,.073,.073),ballmat)
# Seam children track the ball and keep its silhouette readable.
parent(path('Ball seam',[(.073*math.cos(a),.025*math.sin(a*2),.066*math.sin(a)) for a in [i*2*math.pi/40 for i in range(40)]],.003,shirt,True),ball)

def smooth(t):t=max(0,min(1,t));return t*t*t*(t*(t*6-15)+10)
def interp(a,b,t):return Vector(a).lerp(Vector(b),t)
def ik(a,b,l1,l2,pole):
    d=b-a;dist=min(d.length,l1+l2-.001);axis=d.normalized();x=(l1*l1-l2*l2+dist*dist)/(2*dist);h=math.sqrt(max(0,l1*l1-x*x));n=Vector(pole);n=(n-axis*n.dot(axis)).normalized();return a+axis*x+n*h
# Pose milestones. Shoulder rotation follows the pelvis, racket sweeps through contact.
def pose(t):
    load=smooth((t-.55)/.95);swing=smooth((t-1.50)/.80);recover=smooth((t-2.85)/1.6)
    strike=smooth((t-1.50)/.40); follow=smooth((t-1.90)/.55)
    weight=load*(1-recover); yaw=(-.52*load+.5*strike+.65*follow)*(1-recover)
    root=Vector((.16*weight,-.63,1.24-.085*weight+.045*math.sin(math.pi*max(0,min(1,t/.55)))**2))
    body.location=root;body.rotation_euler=(.07+.10*weight,0,yaw)
    hips.location=root+Vector((0,0,-.22));hips.rotation_euler=(0,0,yaw*.45)
    rot=body.rotation_euler.to_matrix()
    rs=root+rot@Vector((.36,0,.58));ls=root+rot@Vector((-.36,0,.58))
    rw=interp((.60,-.55,1.56),(.95,-1.0,1.45),load)
    rw=rw.lerp(Vector((.70,-.10,1.48)),strike).lerp(Vector((-.35,-.52,2.13)),follow);rw=rw.lerp(Vector((.60,-.55,1.56)),recover)
    lw=interp((-.54,-.34,1.57),(-.60,.03,1.83),load)
    lw=lw.lerp(Vector((-.53,-.48,1.59)),swing);lw=lw.lerp(Vector((-.54,-.34,1.57)),recover)
    for tag,shoulder,wrist,pole in [('Right',rs,rw,(1,-1,-.2)),('Left',ls,lw,(-1,-.3,-.3))]:
        # Clamp reach to preserve the limb proportions at all poses.
        delta=wrist-shoulder
        if delta.length>.715:wrist=shoulder+delta.normalized()*.715
        elbow=ik(shoulder,wrist,.36,.37,pole)
        aim(parts[tag+'upper'],shoulder,elbow);aim(parts[tag+'fore'],elbow,wrist)
        joints[tag+'elbow'].location=elbow;joints[tag+'hand'].location=wrist
        if tag=='Right':rw=wrist
    for side,tag in [(-1,'Left'),(1,'Right')]:
        hip=root+Vector((side*.18,0,-.11))
        ankle=Vector((side*(.33+.07*weight),-.63+side*.16*weight,.20))
        knee=ik(hip,ankle,.52,.49,(0,1,0))
        aim(parts[tag+'thigh'],hip,knee);aim(parts[tag+'short'],hip,knee);aim(parts[tag+'shin'],knee,ankle)
        joints[tag+'knee'].location=knee;shoes[tag].location=ankle-Vector((0,0,.20));shoes[tag].rotation_euler.z=-side*.12+side*.14*weight
        aim(parts[tag+'sock'],ankle,ankle+(knee-ankle).normalized()*.17)
    racket.location=rw
    # Preparation to forehand contact to high finish, then ready.
    direction=interp((.50,.07,.62),(.9,-.20,.10),load).lerp(Vector((.95,.10,.30)),strike).lerp(Vector((-.60,.15,.60)),follow).lerp(Vector((.50,.07,.62)),recover).normalized()
    racket.rotation_quaternion=Vector((0,0,1)).rotation_difference(direction)
    bpy.context.view_layer.update()
    return racket.matrix_world@Vector((0,0,.63))
contact_time=1.9; near_contact=pose(contact_time).copy()
for o in roots:
    copies[o].location=o.location.copy();copies[o].rotation_mode=o.rotation_mode
    copies[o].rotation_euler=o.rotation_euler.copy();copies[o].rotation_quaternion=o.rotation_quaternion.copy()
bpy.context.view_layer.update()
far_contact=copies[racket].matrix_world@Vector((0,0,.63))
# One bounce on the receiving side. Piecewise parabolas meet at the ground.
def flight(start,end,q):
    bounce=start.lerp(end,.72);bounce.z=.073
    if q<.68:
        u=q/.68;v=start.lerp(bounce,u);v.z+=1.15*4*u*(1-u)
    else:
        u=(q-.68)/.32;v=bounce.lerp(end,u);v.z+=.14*4*u*(1-u)
    return v
animated=[*roots,*[copies[o] for o in roots],ball]
for frame in range(181):
    t=frame/30
    pose((t+3)%6)
    for o in roots:
        copies[o].location=o.location.copy();copies[o].rotation_mode=o.rotation_mode
        copies[o].rotation_euler=o.rotation_euler.copy();copies[o].rotation_quaternion=o.rotation_quaternion.copy()
    pose(t%6)
    leg=(t-contact_time)%6
    ball.location=flight(near_contact,far_contact,leg/3) if leg<3 else flight(far_contact,near_contact,(leg-3)/3)
    for o in animated:key(o,frame)
# Linear interpolation between baked frames prevents overshoot through the court or racket.
for o in animated:
    if o.animation_data and o.animation_data.action:
        o.animation_data.action.name='Rally · '+o.name
        for layer in o.animation_data.action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for curve in bag.fcurves:
                        for point in curve.keyframe_points:point.interpolation='LINEAR'
scene.frame_set(0)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'assets/objects/tennis-return.glb'),export_format='GLB',export_animations=True,export_animation_mode='SCENE',export_force_sampling=True,export_frame_range=True,export_cameras=False,export_lights=False)
data=(ROOT/'assets/objects/tennis-return.glb').read_bytes()
(ROOT/'src/objects/tennis-asset.ts').write_text('// Generated by scripts/objects/tennis.py. Original UI Pack rally.\nexport default "'+base64.b64encode(data).decode()+'";\n')
# Studio preview; lights/camera are not part of the web model.
scene.render.engine='CYCLES';scene.cycles.samples=24;scene.render.resolution_x=960;scene.render.resolution_y=960;scene.render.resolution_percentage=100;scene.render.film_transparent=True
world=scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.72,.68,1);world.node_tree.nodes['Background'].inputs[1].default_value=.65
for name,loc,power,size in [('Key',(-3,-4,7),650,5),('Fill',(4,1,5),420,4)]:
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(4.5,-8,8));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.6))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=8.3;scene.camera=cam
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'tennis-return.blend'))
for frame in [0,57,110,147]:
    scene.frame_set(frame);scene.render.filepath=str(OUT/f'pose-{frame}.png');bpy.ops.render.render(write_still=True)
(OUT/'verification.json').write_text(json.dumps({'bytes':len(data),'contact_frame':57,'fps':30,'frames':181,'contact_frames':[57,147],'loop_seconds':6,'source':'Original UI Pack model; no external assets'},indent=2))
print('TENNIS_EXPORT_OK',len(data))
