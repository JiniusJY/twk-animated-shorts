import bpy,math,sys
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath='/tmp/twk-icecream/refined.blend');s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=3;s.cycles.use_denoising=True;s.render.resolution_x=540;s.render.resolution_y=960
for o in bpy.data.objects:
 if o.name.startswith(('Control fascia','LCD','Control key','Button marker','Freezer door','Retaining nut','Draw','Handle','Dispensing','Drip','Tray')):o.hide_render=True
for o in bpy.data.objects:
 if o.name.startswith('Beater spiral') and not o.hide_render:
  for sp in o.data.splines:
   for pt in sp.points:pt.co.x-=.17;pt.co.z-=1.065
  o.location=(.17,0,1.065)
import os
os.makedirs('/tmp/twk-icecream/motion/close',exist_ok=True)
for f in range(int(sys.argv[-2]),int(sys.argv[-1])):
 q=f/48;cam=s.camera;cam.location=(1.5-.3*q,-1.8,1.62);cam.rotation_euler=(Vector((.17,-.13,1.1))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=83
 for o in bpy.data.objects:
  if o.name.startswith('Beater spiral') and not o.hide_render:o.rotation_euler.y=f*.2
 s.render.filepath=f'/tmp/twk-icecream/motion/close/{f:04d}.png';bpy.ops.render.render(write_still=True)
