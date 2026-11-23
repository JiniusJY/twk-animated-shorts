import bpy,math,os,sys
from mathutils import Vector
kind=sys.argv[sys.argv.index('--')+1];start=int(sys.argv[-2]);end=int(sys.argv[-1])
p='/tmp/twk-icecream/machine.blend' if kind=='hero' else '/tmp/twk-icecream/refined.blend';bpy.ops.wm.open_mainfile(filepath=p);s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=3;s.cycles.use_denoising=True;s.render.resolution_x=540;s.render.resolution_y=960;s.render.image_settings.file_format='PNG';s.view_settings.view_transform='AgX';cam=s.camera
# Temporal movement tied to an explanatory action, not a generic push on a still.
base={o.name:o.location.copy() for o in bpy.data.objects}
if kind!='hero':
 for o in list(bpy.data.objects):
  if o.name.startswith(('Control fascia','LCD','Control key','Button marker','Freezer door','Retaining nut','Draw','Handle','Dispensing','Drip','Tray')):o.hide_render=True
 # Put beater curve origin on shaft axis so rotation stirs in place.
 for o in bpy.data.objects:
  if o.name.startswith('Beater spiral') and not o.hide_render:
   for sp in o.data.splines:
    for pt in sp.points:pt.co.x-=.17;pt.co.z-=1.065
   o.location=(.17,0,1.065)
os.makedirs('/tmp/twk-icecream/motion/'+kind,exist_ok=True)
for f in range(start,end):
 t=f/36 if kind=='hero' else f/60;q=t*t*(3-2*t)
 if kind=='hero':
  cam.location=(2.25-.15*q,-3.6,2.2+.17*q);target=Vector((0,-.05,.89));cam.data.lens=58
  # Lid lifts to reveal food reservoir, only as narrator introduces heating.
  for o in bpy.data.objects:
   if o.name.startswith(('Hopper lid','Lid handle')):o.location.z=base[o.name].z+.18*max(0,(q-.25)/.75)
 else:
  cam.location=(1.85-.32*q,-2.5,1.9+.10*q);target=Vector((.12,-.08,1.22));cam.data.lens=83
  for o in bpy.data.objects:
   if o.name.startswith('Beater spiral') and not o.hide_render:o.rotation_euler.y=f*.16
  # Product color conveys heat spreading through the mix, not a fake circuit.
  p=bpy.data.materials['Ice cream mix'].node_tree.nodes.get('Principled BSDF');warm=max(0,min(1,(t-.2)/.7));p.inputs['Base Color'].default_value=(.9,.77-.35*warm,.52-.36*warm,1)
 cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=f'/tmp/twk-icecream/motion/{kind}/{f:04d}.png';bpy.ops.render.render(write_still=True)
