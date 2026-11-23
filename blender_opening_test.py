import bpy,bmesh,math,os,time
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath='/tmp/twk-ronaldo-proof/ball-studio.blend')
s=bpy.context.scene
# Bisect existing curved panels and core into actual physical shell halves.
root=bpy.data.objects['Ball assembly'];tops=[];bottoms=[]
for ob in list(root.children):
 if ob.type!='MESH':continue
 for is_top in [True,False]:
  new=ob.copy();new.data=ob.data.copy();bpy.context.collection.objects.link(new)
  bm=bmesh.new();bm.from_mesh(new.data)
  bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.00001,plane_co=(0,0,0),plane_no=(0,0,1),clear_inner=is_top,clear_outer=not is_top)
  bm.to_mesh(new.data);bm.free();(tops if is_top else bottoms).append(new)
 bpy.data.objects.remove(ob,do_unlink=True)
def mat(n,c,rough=.6,metal=0):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;return m
liner=mat('Dark flexible bladder interior',(.065,.075,.072),.9);strap=mat('Suspension ribbons',(.15,.17,.16),.7);metal=mat('Sensor casing',(.12,.17,.19),.35,.45);chipmat=mat('Circuit board',(.025,.1,.07),.55)
# Thin inner hemispheres, cut at actual equator, convey shell thickness.
for is_top in [True,False]:
 bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=32,radius=.978);ob=bpy.context.object;ob.data.materials.append(liner);ob.parent=root
 bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=.00001,plane_co=(0,0,0),plane_no=(0,0,1),clear_inner=is_top,clear_outer=not is_top);bm.to_mesh(ob.data);bm.free()
 solid=ob.modifiers.new('Bladder thickness','SOLIDIFY');solid.thickness=.014
 for p in ob.data.polygons:p.use_smooth=True
 (tops if is_top else bottoms).append(ob)
def cube(n,loc,scale,material):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=n;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material);be=o.modifiers.new('Machined soft edges','BEVEL');be.width=.025;be.segments=4;o.parent=root;return o
sensor=cube('Suspended IMU capsule',(0,0,0),(.32,.23,.14),metal);pcb=cube('Sensor board',(0,0,.085),(.22,.15,.015),chipmat)
for x in [-.06,.04]:cube('Component',(x,0,.104),(.047,.051,.018),metal)
straps=[]
for z in [-1,1]:
 for a in [0,math.pi/2,math.pi,3*math.pi/2]:
  cu=bpy.data.curves.new('Suspension tether','CURVE');cu.dimensions='3D';cu.bevel_depth=.009;cu.bevel_resolution=2;sp=cu.splines.new('POLY');sp.points.add(1);sp.points[0].co=(.14*math.cos(a),.1*math.sin(a),z*.04,1);sp.points[1].co=(.71*math.cos(a),.71*math.sin(a),z*.67,1);o=bpy.data.objects.new('Tether',cu);bpy.context.collection.objects.link(o);o.data.materials.append(strap);o.parent=root;straps.append((o,z,a))
# Hide floor to let shell opening move freely, world stays coherent.
for o in bpy.data.objects:
 if o.type=='MESH' and o.name.startswith('Plane'):o.location.z=-1.8
s.render.resolution_x=360;s.render.resolution_y=640;s.cycles.samples=12;s.render.resolution_percentage=100
cam=s.camera;cam.data.lens=54
os.makedirs('/tmp/blender-opening',exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath='/tmp/twk-ronaldo-proof/ball-cutaway.blend')
start=time.time()
for i in range(36):
 t=i/35;q=max(0,min(1,(t-.15)/.7));q=q*q*(3-2*q)
 root.rotation_euler=(.05,.1,-.1+q*.3)
 for o in tops:o.location.z=q*.53
 for o in bottoms:o.location.z=-q*.53
 for o,z,a in straps:o.data.splines[0].points[1].co=(.71*math.cos(a),.71*math.sin(a),z*(.67+q*.53),1)
 cam.location=(3-.8*q,-6+.7*q,2-.7*q);cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler()
 s.render.filepath=f'/tmp/blender-opening/{i:04d}.png';bpy.ops.render.render(write_still=True)
print('RENDER_SECONDS',time.time()-start)
