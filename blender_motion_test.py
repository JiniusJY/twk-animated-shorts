import bpy,math,os,time
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath='/tmp/twk-ronaldo-proof/ball-studio.blend')
s=bpy.context.scene;s.render.resolution_x=270;s.render.resolution_y=480;s.cycles.samples=8;s.render.resolution_percentage=100
root=bpy.data.objects['Ball assembly'];cam=s.camera;cam.data.lens=50
os.makedirs('/tmp/blender-motion',exist_ok=True)
start=time.time()
for i in range(24):
 t=i/23;root.rotation_euler=(.1,.2,t*.8)
 cam.location=(3-.8*t,-6+.4*t,2-.35*t);cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler()
 s.render.filepath=f'/tmp/blender-motion/{i:04d}.png';bpy.ops.render.render(write_still=True)
print('RENDER_SECONDS',time.time()-start)
