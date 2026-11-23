import bpy,math,os,sys
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=20;s.render.resolution_x=720;s.render.resolution_y=1280;s.render.resolution_percentage=100;s.world.color=(.15,.17,.18)
def mat(n,c,rough=.5,metal=0):
 m=bpy.data.materials.new(n);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;return m
steel=mat('Brushed stainless steel',(.53,.57,.58),.29,.85);dark=mat('Black polymer',(.025,.035,.038),.39);white=mat('Warm white plastic',(.78,.78,.7),.5);cream=mat('Ice cream mix',(.9,.77,.52),.34);red=mat('Muted red fascia',(.47,.025,.025),.4);rubber=mat('Rubber wheels',(.016,.018,.018),.8);copper=mat('Copper pipe',(.4,.17,.065),.35,.8);mint=mat('Cool cycle',(.16,.55,.66),.3,.3);warm=mat('Heat circuit',(.7,.14,.04),.4,.2);floor=mat('Warm studio',(.66,.65,.59),.9);screen=mat('LCD blue-green',(.18,.32,.3),.3)
# Anisotropic microstructure catches long softbox highlights on steel.
p=steel.node_tree.nodes.get('Principled BSDF');p.inputs['Anisotropic'].default_value=.38
noise=steel.node_tree.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=170;bump=steel.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.07;bump.inputs['Distance'].default_value=.008;steel.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);steel.node_tree.links.new(bump.outputs['Normal'],p.inputs['Normal'])
front=[];body=[];inside=[]
def cube(n,loc,sc,ma,bevel=.012,group=None):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=n;o.scale=sc;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(ma)
 if bevel:
  b=o.modifiers.new('Manufactured edge radius','BEVEL');b.width=bevel;b.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 if group is not None:group.append(o)
 return o
def cyl(n,loc,r,depth,ma,axis='Z',group=None):
 bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=r,depth=depth,location=loc);o=bpy.context.object;o.name=n;o.data.materials.append(ma)
 if axis=='Y':o.rotation_euler.x=math.pi/2
 if axis=='X':o.rotation_euler.y=math.pi/2
 b=o.modifiers.new('Rounded rims','BEVEL');b.width=.005;b.segments=2
 for p in o.data.polygons:p.use_smooth=True
 if group is not None:group.append(o)
 return o
def tube(n,pts,r,ma,group=None):
 cu=bpy.data.curves.new(n,'CURVE');cu.dimensions='3D';cu.bevel_depth=r;cu.bevel_resolution=3;sp=cu.splines.new('POLY');sp.points.add(len(pts)-1)
 for v,co in zip(sp.points,pts):v.co=(*co,1)
 o=bpy.data.objects.new(n,cu);bpy.context.collection.objects.link(o);o.data.materials.append(ma)
 if group is not None:group.append(o)
 return o
def text(n,loc,size,ma):
 cu=bpy.data.curves.new(n,'FONT');cu.body=n;cu.size=size;cu.align_x='CENTER';ob=bpy.data.objects.new(n,cu);bpy.context.collection.objects.link(ob);ob.location=loc;ob.rotation_euler=(math.pi/2,0,0);ob.data.materials.append(ma);return ob
# Model proportions based on 641mm x987mm x1535mm service dimensions, recognisable two-outlet layout.
cube('Cabinet core',(0,0,.79),(.64,.93,1.35),dark,.015,body)
cube('Right casing',(.326,0,.8),(.016,.95,1.36),steel,.008,body);cube('Left casing',(-.326,0,.8),(.016,.95,1.36),steel,.008,body)
cube('Top deck',(0,0,1.48),(.67,.98,.036),steel,.01,body)
for x in [-.175,.175]:
 cyl('Hopper lid',(x,.02,1.51),.145,.024,steel);tube('Lid handle',[(x-.06,.02,1.53),(x-.06,.02,1.555),(x+.06,.02,1.555),(x+.06,.02,1.53)],.009,dark)
# Floor wheels, seam details and ventilation.
for x in [-.26,.26]:
 for y in [-.35,.35]:cyl('Caster',(x,y,.09),.065,.035,rubber,'X');cube('Caster bracket',(x,y,.15),(.05,.06,.08),steel,.005)
for x in [-.15,.15]:cube('Lower service door',(x,-.482,.42),(.29,.023,.48),steel,.004,front)
for x in [-.326,.326]:
 for z in [.26+i*.025 for i in range(17)]:cube('Vent slit',(x,0,z),(.022,.5,.009),dark,.002)
# LCD fascia and icon keys, not an invented service-code quotation.
cube('Control fascia',(0,-.493,1.34),(.65,.052,.22),dark,.015,front)
cube('LCD display',(0,-.525,1.37),(.33,.008,.075),screen,.005,front)
for x in [-.25,-.19,.19,.25]:cyl('Control key',(x,-.526,1.31),.017,.008,white,'Y',front)
for x in [-.25,-.19,.19,.25]:cube('Button marker',(x,-.534,1.31),(.013,.003,.003),red,.001,front)
# Distinct shake/softserve doors, draw handles, valve spouts.
for x in [-.17,.17]:
 cube('Freezer door',(x,-.505,1.08),(.22,.072,.24),white,.018,front)
 for dx in [-.095,.095]:
  for z in [.99,1.17]:cyl('Retaining nut',(x+dx,-.554,z),.023,.027,dark,'Y',front)
 cyl('Draw valve',(x,-.57,1.09),.026,.17,steel,'Z',front)
 tube('Draw handle',[(x,-.57,1.13),(x,-.64,1.22),(x,-.66,1.27)],.012,steel,front);cyl('Handle grip',(x,-.66,1.27),.019,.085,dark,'X',front)
 cyl('Dispensing nozzle',(x,-.575,.942),.027,.065,white,'Z',front)
cube('Drip tray',(0,-.6,.77),(.65,.27,.035),steel,.012,front)
for x in [-.28+i*.035 for i in range(17)]:cube('Tray grille',(x,-.6,.792),(.012,.23,.008),dark,.002,front)
cube('Rear lower panel',(0,.48,.55),(.64,.02,.88),steel,.006,body)
# Conceptual functional internals: hoppers, horizontal freezing barrels, mixing shafts and coolant paths.
for x in [-.17,.17]:
 cyl('Hopper wall',(x,.05,1.3),.142,.3,steel,'Z',inside);cyl('Mix surface',(x,.05,1.455),.132,.006,cream,'Z',inside)
 cyl('Freezing barrel',(x,-.08,1.065),.11,.65,steel,'Y',inside);cyl('Mix in barrel',(x,-.12,1.065),.091,.66,cream,'Y',inside)
 cyl('Beater shaft',(x,-.08,1.065),.018,.67,dark,'Y',inside)
 # A helical path conveys agitation, not an exact OEM auger CAD claim.
 pts=[(x+.075*math.cos(k*.16),-.39+k*.0038,1.065+.075*math.sin(k*.16)) for k in range(165)];tube('Beater spiral',pts,.009,steel,inside)
 tube('Mix feed tube',[(x,.05,1.18),(x,.05,1.08),(x,-.15,1.08)],.025,cream,inside)
 pts=[(x+.125*math.cos(k*.14),-.4+k*.0045,1.065+.125*math.sin(k*.14)) for k in range(145)];tube('Heat exchange jacket path',pts,.012,copper,inside)
 cyl('Beater motor',(x,.31,1.065),.082,.18,dark,'Y',inside)
 cube('Compressor',(x,.12,.45),(.23,.29,.28),dark,.04,inside)
 tube('Heat transfer circuit',[(x,-.05,.45),(x,-.2,.58),(x,-.2,.9)],.017,copper,inside)
cube('Controller PCB',(0,-.15,1.36),(.27,.03,.14),mint,.006,inside)
for x in [-.09,0,.09]:cube('Controller chip',(x,-.17,1.37),(.05,.015,.055),dark,.003,inside)
# Single cup catches physical payoff, never a fake labelled McDonalds photograph.
cup=cyl('Paper cup',(.17,-.58,.86),.055,.12,white)
creampts=[(.17+(.043*(1-k/220)) * math.cos(k*.16),-.58+(.043*(1-k/220))*math.sin(k*.16),.925+k*.00055) for k in range(220)];swirl=tube('Soft serve swirl',creampts,.014,cream)
# Studio with cafe-like warm/cool pools, no sourced brand imagery.
cube('Ground',(0,0,-.025),(200,200,.04),floor,.0)
bpy.ops.object.camera_add(location=(2.25,-3.6,2.2));cam=bpy.context.object;s.camera=cam;cam.data.lens=58
for loc,power,size,col in [((-2,-3,4),650,3,(1,.88,.72)),((3,-1,3.1),850,2,(.76,.88,1)),((0,3,4),900,2,(1,1,1))]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.shape='RECTANGLE';o.data.size=size;o.data.size_y=size*2;o.data.color=col;o.rotation_euler=(Vector((0,0,.8))-o.location).to_track_quat('-Z','Y').to_euler()
def setup(t):
 q=max(0,min(1,t))
 for o in front:o.hide_render=q>.1
 for o in body:o.hide_render=q>.5
 for o in inside:o.hide_render=q<.5
 cup.hide_render=q>.1;swirl.hide_render=q>.1
 cam.location=(2.25-q*.8,-3.6,2.2+q*.1);cam.rotation_euler=(Vector((0,-.05,.85))-cam.location).to_track_quat('-Z','Y').to_euler()
setup(0);bpy.ops.wm.save_as_mainfile(filepath='/tmp/twk-icecream/machine.blend')
os.makedirs('/tmp/icecream-proofs',exist_ok=True)
for i in [0,1]:
 setup(i);s.render.filepath=f'/tmp/icecream-proofs/{i}.png';bpy.ops.render.render(write_still=True)
