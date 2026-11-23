import bpy,math
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath='/tmp/twk-icecream/machine.blend');s=bpy.context.scene
# Remove conceptual routing, never pretend a decorative coil is an OEM circuit.
for o in list(bpy.data.objects):
 if o.name.startswith(('Heat exchange','Heat transfer','Cabinet core','Right casing','Vent slit','Top deck','Hopper lid','Lid handle','Paper cup','Soft serve swirl','Controller','Mix surface','Mix in barrel')):bpy.data.objects.remove(o,do_unlink=True)
# Keep base/casters, lower cabinet, fascia and the left door physically assembled.
for o in bpy.data.objects:
 o.hide_render=False
 if o.name.startswith(('Freezer door','Retaining nut','Draw valve','Draw handle','Handle grip','Dispensing nozzle')) and o.location.x>0:o.hide_render=True
 if o.name.startswith(('Hopper wall','Freezing barrel','Beater shaft','Beater spiral','Mix feed tube','Beater motor','Compressor')):
  if o.location.x < -.05 and not o.name.startswith(('Beater spiral','Mix feed')):o.hide_render=True
# Half-section shells, remove front/right quarter to see the actual functional relation.
def cut(o,loc,scale):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);c=bpy.context.object;c.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 bpy.context.view_layer.objects.active=o;m=o.modifiers.new('Section removed','BOOLEAN');m.operation='DIFFERENCE';m.object=c;bpy.ops.object.modifier_apply(modifier=m.name);bpy.data.objects.remove(c,do_unlink=True)
for o in list(bpy.data.objects):
 if o.name.startswith('Hopper wall'):
  if o.location.x<0:o.hide_render=True;continue
  cut(o,(.37,-.1,1.3),(.4,.5,.5))
 if o.name.startswith('Freezing barrel'):
  if o.location.x<0:o.hide_render=True;continue
  cut(o,(.38,-.08,1.15),(.4,.85,.4))
 if o.name.startswith('Beater spiral'):
  # mesh exists in world-space, identify by curve centroid, not object location.
  if o.data.splines[0].points[0].co.x<0:o.hide_render=True
# Replace liquid blocks with visible sectional surfaces rather than a solid opaque cylinder.
cream=bpy.data.materials['Ice cream mix']
def cyl(n,loc,r,d):
 bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=r,depth=d,location=loc);o=bpy.context.object;o.name=n;o.data.materials.append(cream);return o
h=cyl('Sectioned hopper mix',(.17,.05,1.30),.131,.25);cut(h,(.37,-.1,1.3),(.4,.5,.5))
b=cyl('Sectioned barrel mix',(.17,-.08,1.065),.088,.64);b.rotation_euler.x=math.pi/2;bpy.context.view_layer.objects.active=b;bpy.ops.object.transform_apply(location=False,rotation=True,scale=False);cut(b,(.38,-.08,1.15),(.4,.85,.4))
# Hide unsupported lower hardware from the explanatory section and keep the sealed lower cabinet.
for o in bpy.data.objects:
 if o.name.startswith('Compressor'):o.hide_render=True
# Sensor probe is a functional schematic feature, not a claimed exact OEM placement.
m=bpy.data.materials['Black polymer']
bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=.017,location=(.215,-.31,1.12));bpy.context.object.name='Temperature sensor emphasis';bpy.context.object.data.materials.append(m)
s.render.engine='CYCLES';s.cycles.samples=12;s.render.resolution_x=720;s.render.resolution_y=1280
cam=s.camera;cam.location=(1.9,-3.3,2.15);cam.rotation_euler=(Vector((0,-.07,.9))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=65
bpy.ops.wm.save_as_mainfile(filepath='/tmp/twk-icecream/section.blend');s.render.filepath='/tmp/icecream-proofs/section.png';bpy.ops.render.render(write_still=True)
s.render.engine='CYCLES'
