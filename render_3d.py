"""Bounded resumable production render. Run START END (exclusive)."""
import bpy,math,os,sys,time
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath='/tmp/twk-ronaldo-proof/ball-production.blend')
s=bpy.context.scene;root=bpy.data.objects['Ball assembly'];cam=s.camera
for o in bpy.data.objects:
 if o.type=='MESH' and o.name.startswith('Plane'):o.scale=(100,100,100)
# Bisected objects retain duplicate names; classify by geometric local centroid.
tops=[];bottoms=[]
for o in root.children:
 if o.type=='MESH' and o.name not in ['Suspended IMU capsule','Sensor board'] and not o.name.startswith('Component'):
  if len(o.data.vertices):
   z=sum(v.co.z for v in o.data.vertices)/len(o.data.vertices)
   if z>.01:tops.append(o)
   elif z<-.01:bottoms.append(o)
straps=[o for o in root.children if o.type=='CURVE']
orig={o.name:o.data.splines[0].points[1].co.copy() for o in straps}
def ease(a,b,t):
 q=max(0,min(1,(t-a)/(b-a)));return q*q*(3-2*q)
os.makedirs('/tmp/ronaldo-3d-production',exist_ok=True)
start,end=map(int,sys.argv[sys.argv.index('--')+1:]);clock=time.time()
for i in range(start,end):
 path=f'/tmp/ronaldo-3d-production/{i:04d}.png'
 if os.path.exists(path):continue
 t=i/12+2.66
 # Closed exterior through4.16s, real shell opens to explain suspension.
 q=ease(4.16,6.0,t)
 sep=q*.53
 for o in tops:o.location.z=sep
 for o in bottoms:o.location.z=-sep
 for o in straps:
  co=orig[o.name].copy();co.z+=math.copysign(sep,co.z);o.data.splines[0].points[1].co=co
 # One physical assembly. Accelerometer translates, gyro rotates, then camera settles for samples.
 rot=.10+max(0,min(t-2.66,1.5))*.2
 if 10.94<=t<13.46:rot+=(t-10.94)*1.6
 elif t>=13.46:rot+=2.52*1.6
 root.rotation_euler=(.07,.08,rot)
 root.location.x=.07*math.sin((t-8.88)*9) if 8.88<t<10.94 else 0
 # Zoom to capsule for accelerometer and sampling, return to full cutaway for touch evidence.
 zoom=ease(7.7,8.88,t)*(1-ease(10.3,10.94,t))*.28
 zoom+=ease(13.46,14.5,t)*(1-ease(18.7,19.62,t))*.23
 zc=1.45-.5*q
 cam.location=(2.5*(1-zoom),-6.3*(1-zoom),zc*(1-zoom));cam.data.lens=45
 target=Vector((0,0,0));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
 # Return closed shell for statement, then studio ball remains behind explanatory overlays.
 if t>=22.04:
  close=1-ease(22.04,22.9,t)
  for o in tops:o.location.z=sep*close
  for o in bottoms:o.location.z=-sep*close
  for o in straps:
   co=orig[o.name].copy();co.z+=math.copysign(sep*close,co.z);o.data.splines[0].points[1].co=co
  cam.location=(2.5,-6.3,1.45);cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
 s.render.filepath=path;bpy.ops.render.render(write_still=True)
print('BATCH_SECONDS',time.time()-clock)
