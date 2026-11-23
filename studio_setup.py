import bpy,math
bpy.ops.wm.open_mainfile(filepath='/tmp/twk-ronaldo-proof/ball-production.blend')
mat=None
for o in list(bpy.data.objects):
 if o.type=='MESH' and o.name.startswith('Plane'):mat=o.data.materials[0];bpy.data.objects.remove(o,do_unlink=True)
rows=[(-40,-2.2),(2,-2.2)]+[(2+5*math.sin(i*math.pi/40),2.8-5*math.cos(i*math.pi/40)) for i in range(1,21)]+[(7,30)]
v=[(x,y,z) for y,z in rows for x in [-60,60]];f=[(i*2,i*2+1,i*2+3,i*2+2) for i in range(len(rows)-1)]
me=bpy.data.meshes.new('Seamless studio cyclorama');me.from_pydata(v,[],f);me.update();o=bpy.data.objects.new('Cyclorama',me);bpy.context.collection.objects.link(o);o.data.materials.append(mat)
for p in me.polygons:p.use_smooth=True
bpy.ops.wm.save_as_mainfile(filepath='/tmp/twk-ronaldo-proof/ball-production.blend')
