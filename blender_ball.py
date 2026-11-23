import bpy,math,json,sys,bmesh
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,color,rough=.6,noise=False,metal=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;n=m.node_tree.nodes;p=n.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 if noise:
  tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=150;tex.inputs['Detail'].default_value=2
  bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.27;bump.inputs['Distance'].default_value=.018;m.node_tree.links.new(tex.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],p.inputs['Normal'])
 return m
white=mat('Off-white microtextured synthetic leather',(.78,.8,.76),.72,True);black=mat('Charcoal textured panels',(.018,.023,.025),.67,True);seam=mat('Recessed seam',(.027,.03,.03));floor=mat('Studio ground',(.17,.19,.2),.85)
root=bpy.data.objects.new('Ball assembly',None);bpy.context.collection.objects.link(root)
# Curved inset panel patches built directly on spherical geometry, not a texture projection.
for i,poly in enumerate(json.load(open('/tmp/ball-panels.json'))):
 points=[Vector(x) for x in poly];c=sum(points,Vector())/len(points);points=[(p-c)*.988+c for p in points];verts=[];faces=[]
 res=12
 for k in range(len(points)):
  a=c.normalized();b=points[k];cc=points[(k+1)%len(points)];idx={}
  for u in range(res+1):
   for v in range(res+1-u):
    p=(a*(1-(u+v)/res)+b*u/res+cc*v/res).normalized();idx[u,v]=len(verts);verts.append(tuple(p))
  for u in range(res):
   for v in range(res-u):
    faces.append((idx[u,v],idx[u+1,v],idx[u,v+1]))
    if v<res-u-1:faces.append((idx[u+1,v],idx[u+1,v+1],idx[u,v+1]))
 me=bpy.data.meshes.new('Curved panel');me.from_pydata(verts,[],faces);me.update();bm=bmesh.new();bm.from_mesh(me);bmesh.ops.remove_doubles(bm,verts=bm.verts,dist=.00001);bm.to_mesh(me);bm.free();ob=bpy.data.objects.new('Pentagon' if len(poly)==5 else 'Hexagon',me);bpy.context.collection.objects.link(ob);ob.data.materials.append(black if len(poly)==5 else white);ob.parent=root
 for p in me.polygons:p.use_smooth=True
 solid=ob.modifiers.new('Real shell thickness','SOLIDIFY');solid.thickness=.008
 bevel=ob.modifiers.new('Fine rounded panel edges','BEVEL');bevel.width=.003;bevel.segments=2
bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=32,radius=.993);ob=bpy.context.object;ob.data.materials.append(seam);ob.parent=root
for p in ob.data.polygons:p.use_smooth=True
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-1.07));bpy.context.object.data.materials.append(floor)
def area(name,loc,energy,size,color):
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=energy;o.data.shape='DISK';o.data.size=size;o.data.color=color;o.rotation_euler=(Vector((0,0,0))-o.location).to_track_quat('-Z','Y').to_euler()
area('Large softbox',(-3,-4,5),600,4,(1,.96,.9));area('Cool rim',(3,1,3),800,3,(.75,.85,1));area('Soft fill',(1,-4,0),100,3,(1,1,1))
bpy.ops.object.camera_add(location=(3,-6,2));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=58;bpy.context.scene.camera=cam
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=24;s.cycles.use_denoising=True;s.render.resolution_x=720;s.render.resolution_y=900;s.render.resolution_percentage=100;s.world.color=(.12,.12,.12);s.render.image_settings.file_format='PNG';s.render.filepath='/downloads/blender-ball-material-proof.png';s.view_settings.view_transform='AgX'
root.rotation_euler=(.1,.2,.1);bpy.ops.wm.save_as_mainfile(filepath='/tmp/twk-ronaldo-proof/ball-studio.blend');bpy.ops.render.render(write_still=True)
