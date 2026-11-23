import bpy,math
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath='/tmp/twk-icecream/section.blend');s=bpy.context.scene
for o in list(bpy.data.objects):
 if o.name.startswith(('Hopper wall','Freezing barrel','Sectioned','Left casing','Rear lower panel','Mix feed')):bpy.data.objects.remove(o,do_unlink=True)
def half(n,c,r,length,axis,ma):
 vs=[];fs=[]
 for j in [0,1]:
  for k in range(49):
   a=math.pi/2+math.pi*k/48;x=c[0]+r*math.cos(a)
   vs.append((x,c[1]+r*math.sin(a),c[2]+(j-.5)*length) if axis=='Z' else (x,c[1]+(j-.5)*length,c[2]+r*math.sin(a)))
 for k in range(48):fs.append((k,k+1,k+50,k+49))
 me=bpy.data.meshes.new(n);me.from_pydata(vs,[],fs);o=bpy.data.objects.new(n,me);bpy.context.collection.objects.link(o);o.data.materials.append(ma);m=o.modifiers.new('Shell thickness','SOLIDIFY');m.thickness=.009
 for p in me.polygons:p.use_smooth=True
 return o
half('Open hopper shell',(.17,.05,1.3),.142,.30,'Z',bpy.data.materials['Brushed stainless steel'])
half('Open barrel shell',(.17,-.08,1.065),.11,.65,'Y',bpy.data.materials['Brushed stainless steel'])
# Planar cream sections in the same half-spaces so the material and sensor relation are legible.
def slab(n,points,ma):
 me=bpy.data.meshes.new(n);me.from_pydata(points,[],[tuple(range(len(points)))]);o=bpy.data.objects.new(n,me);bpy.context.collection.objects.link(o);o.data.materials.append(ma);return o
cream=bpy.data.materials['Ice cream mix'];slab('Hopper mix section',[(.169,-.075,1.17),(.169,.175,1.17),(.169,.175,1.43),(.169,-.075,1.43)],cream)
# Barrel lower hemisphere leaves the beater visible above mix; functional schematic, not exact fill state.
half('Mix layer visible',(.17,-.08,1.065),.088,.64,'Y',cream)
# Reinstate closed lower housing so casters are never floating.
steel=bpy.data.materials['Brushed stainless steel']
for loc,sc in [((.326,0,.5),(.016,.95,.7)),((-.326,0,.5),(.016,.95,.7)),((0,.48,.5),(.64,.02,.7))]:
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=sc;o.data.materials.append(steel)
cam=s.camera;cam.location=(1.85,-2.5,1.9);cam.rotation_euler=(Vector((.08,-.08,1.18))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=83
s.render.filepath='/tmp/icecream-proofs/section-refined.png';bpy.ops.wm.save_as_mainfile(filepath='/tmp/twk-icecream/refined.blend');bpy.ops.render.render(write_still=True)
