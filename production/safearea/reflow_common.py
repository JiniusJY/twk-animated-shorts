from PIL import Image,ImageDraw,ImageFont
F='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def card(w,h):
 src=Image.open('/tmp/twk-ronaldo-proof/out/endcard/0090.png').convert('RGB');im=src.resize((w,h));im=Image.new('RGB',(w,h),'#111719')
 # Preserve all approved card copy as readable strips. No new marketing wording.
 for box,pos,width in [((75,267,460,314),(55,165),370),((55,353,470,465),(55,235),370),((60,485,475,534),(55,350),370),((60,549,477,605),(60,405),330),((60,607,475,695),(60,475),330)]:
  piece=src.crop(box);piece=piece.resize((width,round(piece.height*width/piece.width)));im.paste(piece,pos)
 return im.resize((w,h))
