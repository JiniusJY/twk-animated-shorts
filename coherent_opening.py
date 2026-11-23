import pathlib,sys,cairosvg,math
sys.path.insert(0,'/tmp/twk-ronaldo-proof');from motion_proof import svg,text,path,INK,PAPER,RED
out=pathlib.Path('/tmp/twk-ronaldo-proof/out/opening');out.mkdir(exist_ok=True)
for i in range(313):
 t=i/30
 if t<6:
  base=svg(min(3.19,t/1.75))
  # Lower caption matches spoken words, keep visual no-touch question distinct.
  cap='Cristiano Ronaldo celebrated' if t<2.2 else 'this World Cup goal.' if t<3.8 else 'But did he even touch the ball?'
  base=base.replace('</svg>',f'<rect x="0" y="814" width="540" height="146" fill="{PAPER}"/>'+text(270,866,cap,18,INK,'700','middle')+text(270,907,'Illustrated recreation',11,INK,'500','middle')+'</svg>')
 else:
  q=min(1,(t-6)/.8)
  base=f'<svg xmlns="http://www.w3.org/2000/svg" width="540" height="960"><rect width="540" height="960" fill="{PAPER}"/>'+text(30,43,'TECHWHOKNOWS',11,RED)+path('M30 55H510','none',INK,.8)+text(30,110,'PORTUGAL v URUGUAY',28,INK,'800')+text(30,151,'WORLD CUP · 2022',15,RED,'700')
  base+=text(270,284,'THE OFFICIAL CREDIT',17,INK,'600','middle')
  base+=f'<g transform="translate(0 {35*(1-q)})" opacity="{q}"><rect x="35" y="332" width="470" height="225" rx="10" fill="{INK}"/>'+text(270,419,'BRUNO',56,PAPER,'800','middle')+text(270,484,'FERNANDES',51,PAPER,'800','middle')+'</g>'
  base+=text(270,627,'FIFA awarded him the goal.',24,INK,'700','middle')+text(270,675,'Ball data later supported no Ronaldo touch.',15,RED,'600','middle')
  base+=path('M55 757H485','none',INK,1)+text(270,802,'OFFICIALS DECIDE. SENSORS PROVIDE EVIDENCE.',12,INK,'700','middle')+text(270,909,'Source: adidas statement via FIFA, 29 Nov 2022',10,INK,'500','middle')+'</svg>'
 cairosvg.svg2png(bytestring=base.encode(),write_to=str(out/f'{i:04d}.png'))
