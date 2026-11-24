from PIL import Image,ImageDraw,ImageFont
F='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
B='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def card(w,h):
 src=Image.open('/tmp/twk-ronaldo-proof/out/endcard/0090.png').convert('RGB');im=Image.new('RGB',(540,960),'#111719');d=ImageDraw.Draw(im)
 logo=src.crop((220,157,320,256)).resize((78,78));im.paste(logo,(186,125))
 def text(y,s,n=18,fill='white',bold=False):d.text((60,y),s,font=ImageFont.truetype(B if bold else F,n),fill=fill)
 text(202,'@techwhoknows',25,bold=True)
 d.rounded_rectangle((297,206,391,230),12,fill='#53c7e5');d.text((344,211),'✓ Following',font=ImageFont.truetype(B,11),fill='#111719',anchor='mt')
 text(250,'FREE DAILY NEWSLETTER',13,'#53c7e5',True)
 text(278,'Master tech in 1 minute',25,bold=True);text(310,'a day',25,bold=True)
 text(350,'Get the latest tech news,',18,'#c6c8c8');text(375,'understand why it matters,',18,'#c6c8c8');text(400,'and learn how to apply it',18,'#c6c8c8');text(425,'in your work.',18,'#c6c8c8')
 icons=src.crop((63,551,228,596)).resize((132,36));im.paste(icons,(60,459))
 text(506,'Join 50,000+ readers from Apple,',15,'#c6c8c8');text(529,'OpenAI, NASA & more',15,'#c6c8c8')
 d.rounded_rectangle((60,560,390,606),8,fill='#53c7e5');d.text((225,574),'Subscribe free · link in bio ↗',font=ImageFont.truetype(B,18),fill='#111719',anchor='mt')
 text(616,'Free. Unsubscribe in one click.',12,'#c6c8c8')
 return im.resize((w,h))
