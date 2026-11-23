from PIL import Image,ImageDraw,ImageFont,ImageEnhance
im=Image.open('/tmp/icecream-proofs/0.png').convert('RGB').resize((1080,1920));im=ImageEnhance.Contrast(im).enhance(1.1)
d=ImageDraw.Draw(im);f='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def t(y,s,n):
 ft=ImageFont.truetype(f,n);w=d.textlength(s,font=ft);d.text(((1080-w)/2,y),s,font=ft,fill='#fff6df',stroke_width=2,stroke_fill='#24292a')
t(125,'WHY NO',116);t(257,'ICE CREAM?',116)
# The lock overlay is a clearly graphic metaphor, not an error display or captured evidence.
x,y=815,1290;r=90;d.arc((x-58,y-95,x+58,y+20),180,360,fill='#c7472f',width=18);d.line((x-58,y-37,x-58,y-8),fill='#c7472f',width=18);d.line((x+58,y-37,x+58,y-8),fill='#c7472f',width=18);d.rounded_rectangle((x-r,y-20,x+r,y+112),radius=20,fill='#c7472f');d.ellipse((x-8,y+15,x+8,y+44),fill='#fff5dc')
im.save('/downloads/TWK-Ice-Cream-Cover-v1.jpg',quality=95)
