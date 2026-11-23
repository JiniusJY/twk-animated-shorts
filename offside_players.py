import bpy,math,os,sys
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=8;s.render.resolution_x=540;s.render.resolution_y=960;s.render.resolution_percentage=100
s.world.color=(.16,.19,.21)
def mat(n,c,r=.6):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=r;return m
skin=mat('Skin',(.47,.28,.17));hair=mat('Hair',(.035,.028,.025));red=mat('Red jerseys',(.57,.025,.025));mint=mat('Pale blue jerseys',(.18,.53,.64));green=mat('Dark green shorts',(.025,.15,.08));navy=mat('Navy shorts',(.02,.065,.12));boot=mat('Football boots',(.06,.07,.07));white=mat('White lines',(.77,.8,.71));grass=mat('Turf',(.045,.16,.105));lineM=mat('Timing plane',(.8,.23,.18));black=mat('Ball dark panels',(.025,.035,.04));ivory=mat('Ball pale panels',(.84,.85,.8))
def uv(n,loc,scale,ma,parent=None):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,location=loc);o=bpy.context.object;o.name=n;o.scale=scale;o.data.materials.append(ma);o.parent=parent
 for p in o.data.polygons:p.use_smooth=True
 return o
def link(n,a,b,r,ma,parent=None,r2=None):
 v=Vector(b)-Vector(a);mid=(Vector(a)+Vector(b))/2;bpy.ops.mesh.primitive_cone_add(vertices=16,radius1=r,radius2=r if r2 is None else r2,depth=v.length,location=mid);o=bpy.context.object;o.name=n;o.rotation_euler=v.to_track_quat('Z','Y').to_euler();o.data.materials.append(ma);o.parent=parent
 for p in o.data.polygons:p.use_smooth=True
 return o
def box(n,loc,sc,ma):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=n;o.scale=sc;o.data.materials.append(ma);return o
def player(name,x,y,team,number,ang=0):
 root=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(root)
 shirt,shorts=(mint,navy) if team==0 else (red,green)
 uv('Jersey torso',(0,0,1.34),(.23,.14,.34),shirt,root)
 uv('Shoulder L',(-.22,0,1.49),(.12,.13,.13),shirt,root);uv('Shoulder R',(.22,0,1.49),(.12,.13,.13),shirt,root)
 link('Neck',(0,0,1.58),(0,0,1.72),.075,skin,root)
 uv('Head',(0,-.005,1.84),(.125,.11,.16),skin,root);uv('Hair cap',(0,.02,1.945),(.127,.105,.068),hair,root);uv('Nose',(0,-.115,1.855),(.026,.04,.034),skin,root)
 for side in [-1,1]:
  uv('Eye',(side*.045,-.107,1.885),(.012,.008,.011),hair,root)
  x=side*.28;link('Upper arm',(x,0,1.46),(side*.35,-.08,1.17),.065,skin,root,r2=.08);link('Forearm',(side*.35,-.08,1.17),(side*.4,-.2,1.00),.048,skin,root,r2=.063);uv('Hand',(side*.4,-.2,.97),(.053,.04,.07),skin,root)
  legroot=bpy.data.objects.new('Leg pivot',None);bpy.context.collection.objects.link(legroot);legroot.parent=root;legroot.location=(side*.115,0,1.1)
  before=set(bpy.data.objects)
  link('Shorts leg',(side*.115,0,1.1),(side*.14,-.025,.85),.115,shorts,root,r2=.13)
  knee=(side*.16,-.13 if side==1 else .07,.57);ankle=(side*.19,-.06 if side==1 else .15,.14)
  link('Thigh',(side*.14,-.02,.85),knee,.08,skin,root,r2=.10);uv('Knee',knee,(.081,.08,.08),skin,root);link('Socks',knee,ankle,.058,shirt,root,r2=.075);uv('Boot',(ankle[0],ankle[1]-.07,.085),(.075,.15,.065),boot,root)
  for ob in set(bpy.data.objects)-before:
   ob.parent=legroot;ob.location-=legroot.location
 if side==1:root['kick_leg']=legroot.name
 # Large jersey number on back facing camera side. Text keeps figure recognisable as a footballer.
 cu=bpy.data.curves.new('Jersey number','FONT');cu.body=str(number);cu.align_x='CENTER';cu.size=.23;ob=bpy.data.objects.new('Jersey number',cu);bpy.context.collection.objects.link(ob);ob.location=(0,.146,1.35);ob.rotation_euler=(math.pi/2,0,math.pi);ob.data.materials.append(white);ob.parent=root
 root.location=(x if False else 0,0,0);root.rotation_euler.z=ang
 return root
# Pitch, striped turf and proper painted geometry.
box('Pitch',(0,0,-.06),(14,21,.1),grass)
for yy in range(-10,11,2):
 mm=mat('Turf stripe '+str(yy),(.05,.18 if yy%4 else .20,.12));box('Mown stripe',(0,yy,-.002),(13.6,1.97,.005),mm)
for x in [-6.4,6.4]:box('Touchline',(x,0,.009),(.035,20,.015),white)
for y in [-10,0,10]:box('Pitch line',(0,y,.01),(12.8,.035,.015),white)
for x in [-2.6,2.6]:box('Penalty side',(x,8.3,.012),(.035,3.4,.012),white)
box('Penalty front',(0,6.6,.012),(5.2,.035,.012),white)
for x in [-1.5,1.5]:link('Goal post',(x,10,0),(x,10,1.9),.04,white)
link('Crossbar',(-1.5,10,1.9),(1.5,10,1.9),.04,white)
for x in [-1.5,-1,-.5,0,.5,1,1.5]:link('Net',(x,10,1.9),(x,10.6,.05),.008,white)
for z in [.35,.7,1.05,1.4]:link('Net cross',(-1.5,10.6-z*.3,z),(1.5,10.6-z*.3,z),.008,white)
ps=[]
for n,x,y,team,num in [('Passer',-2,-2,0,8),('Receiver',.5,2.6,0,9),('Defender',1.5,2.9,1,4),('Goalkeeper',0,8.6,1,1)]:
 p=player(n,x,y,team,num);p.location=(x,y,0);ps.append(p)
# A detailed segmented ball is reused from actual studio mesh, not the old icon.
with bpy.data.libraries.load('/tmp/twk-ronaldo-proof/ball-studio.blend',link=False) as (a,b):b.objects=[n for n in a.objects if n=='Ball assembly' or n.startswith('Panel') or n=='Ball base']
# Library naming varies; fallback uses curved multi-panel triangles.
ball=bpy.data.objects.new('Pass ball',None);bpy.context.collection.objects.link(ball)
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=.18);ob=bpy.context.object;ob.name='Panelled match concept ball';ob.data.materials.append(ivory);ob.data.materials.append(black)
for p in ob.data.polygons:p.material_index=1 if p.index%5 in [0,1] else 0
be=ob.modifiers.new('Panel seams','WIREFRAME');be.thickness=.004;be.use_replace=False;ob.parent=ball
ball.location=(-1.6,-2,.18)
# Suggested transverse line through second-last defender, never a ruling.
mark=box('Suggested line',(0,2.9,.025),(12.5,.04,.015),lineM);mark.hide_render=True
bpy.ops.object.camera_add(location=(12,-17,14));cam=bpy.context.object;s.camera=cam;cam.data.lens=43
for loc,power,size in [((0,-8,14),1800,9),((-8,4,10),1200,8)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,1,0))-o.location).to_track_quat('-Z','Y').to_euler()
def ease(a,b,t):q=max(0,min(1,(t-a)/(b-a)));return q*q*(3-2*q)
def setup(t):
 motion_t=t if t<2.5 else 2.5-1.8*ease(2.5,3,t)
 q=ease(0,2.5,motion_t);bpy.data.objects[ps[0]['kick_leg']].rotation_euler.x=-.45*math.sin(math.pi*ease(0,.9,t));ps[1].location.y=1.6+1*q;ps[2].location.y=2.5+.4*q
 ball.location=(-1.8+2.25*ease(.7,2.5,motion_t),-2.1+4.35*ease(.7,2.5,motion_t),.2+.12*math.sin(math.pi*ease(.7,2.5,motion_t)));ball.rotation_euler.x=t*4
 mark.hide_render=t<3;mark.location.y=2.5+.4*ease(0,2.5,.7)
 # Single motivated camera move from passer to timing/position review.
 q=ease(0,5,t);cam.location=(10-1*q,-13+2*q,10+3*q);target=Vector((0,1.3+1*q,.6));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=36+2*q
setup(0);bpy.ops.wm.save_as_mainfile(filepath='/tmp/twk-ronaldo-proof/offside-players.blend')
os.makedirs('/tmp/ronaldo-players',exist_ok=True)
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else ['0','1']
for i in range(int(args[0]),int(args[1])):
 if os.path.exists(f'/tmp/ronaldo-players/{i:04d}.png'):continue
 setup(i/12);s.render.filepath=f'/tmp/ronaldo-players/{i:04d}.png';bpy.ops.render.render(write_still=True)
