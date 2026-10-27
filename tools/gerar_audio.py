#!/usr/bin/env python3
"""Sintetiza a trilha e os efeitos do Valdoria (numpy/scipy) e converte para MP3 (ffmpeg).
Uso: python3 tools/gerar_audio.py   ->  assets/audio/*.mp3 e assets/audio/sfx.json"""
import numpy as np, json, os, subprocess, tempfile, wave
from scipy import signal
SR=44100
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','assets','audio')
os.makedirs(OUT,exist_ok=True)
rng=np.random.default_rng(7)
def f(m): return 440.0*2**((m-69)/12)
def lp(x,fc,o=2): b,a=signal.butter(o,min(fc,SR/2-100)/(SR/2)); return signal.lfilter(b,a,x)
def hp(x,fc,o=2): b,a=signal.butter(o,fc/(SR/2),'high'); return signal.lfilter(b,a,x)
def bp(x,f1,f2,o=2): b,a=signal.butter(o,[f1/(SR/2),min(f2,SR/2-100)/(SR/2)],'band'); return signal.lfilter(b,a,x)
def T(d): return np.arange(int(d*SR))/SR
def adsr(n,a,d,s,r):
    e=np.ones(n); na=min(n,int(a*SR)); nd=int(d*SR); nr=min(n,int(r*SR))
    if na>0: e[:na]=np.linspace(0,1,na)
    if nd>0 and na+nd<=n: e[na:na+nd]=np.linspace(1,s,nd); e[na+nd:]=s
    if nr>0: e[-nr:]*=np.linspace(1,0,nr)
    return e
def saw(fr,t,ph=0): return 2*((fr*t+ph)%1)-1
def sqr(fr,t): return np.sign(np.sin(2*np.pi*fr*t))
def noise(n): return rng.standard_normal(n)
def put(buf,x,start,gain=1.0,pan=0.0):
    i=int(start*SR); 
    if i>=buf.shape[1]: return
    j=min(buf.shape[1],i+len(x)); x=x[:j-i]
    l=gain*np.cos((pan+1)*np.pi/4); r=gain*np.sin((pan+1)*np.pi/4)
    buf[0,i:j]+=x*l; buf[1,i:j]+=x*r
# ---------- instrumentos ----------
def pad(ms,d,v=.9):
    t=T(d); x=np.zeros_like(t)
    for m in ms:
        for dt in (-7,0,7): x+=saw(f(m)*2**(dt/1200),t,rng.random())*.35
        x+=np.sin(2*np.pi*f(m)*t)*.5
    x=lp(x,1700)*adsr(len(t),.7,.2,.8,1.1)/max(1,len(ms))**.6*.5
    return x*v
def strings(ms,d,v=.8,stac=False):
    t=T(d); x=np.zeros_like(t); vib=1+.004*np.sin(2*np.pi*5.3*t)
    for m in ms:
        for dt in (-9,0,9): x+=saw(f(m)*vib*2**(dt/1200),t,rng.random())*.3
    x=lp(x,3600)*(adsr(len(t),.02,.12,.55,.12) if stac else adsr(len(t),.35,.2,.85,.5))/max(1,len(ms))**.6*.5
    return x*v
def harp(m,d=1.4,v=.8):
    t=T(d); x=np.zeros_like(t)
    for h in range(1,8): x+=np.sin(2*np.pi*f(m)*h*t)*np.exp(-t*(2.2+h*1.4))/h
    x+=noise(len(t))*np.exp(-t*90)*.05
    return x*v*.45
def bass(m,d,v=.9):
    t=T(d); x=lp(saw(f(m),t)*.7+sqr(f(m),t)*.3,420,3)*adsr(len(t),.01,.12,.6,.08); return x*v*.9
def lead(m,d,v=.8,bright=.3):
    t=T(d); vib=1+.006*np.sin(2*np.pi*5.6*t)*np.minimum(1,t*4)
    x=np.sin(2*np.pi*f(m)*vib*t)+bright*np.sin(4*np.pi*f(m)*vib*t)+.12*np.sin(6*np.pi*f(m)*vib*t)
    x+=bp(noise(len(t)),1500,4500)*.02
    return x*adsr(len(t),.06,.1,.8,.18)*v*.4
def brass(m,d,v=.8):
    t=T(d); s=saw(f(m),t)+.6*saw(f(m)*1.003,t,.3); a=lp(s,800); b=lp(s,3200)
    k=np.minimum(1,t/.14); x=a*(1-k)+b*k
    return x*adsr(len(t),.05,.1,.8,.14)*v*.32
def kick(v=1):
    t=T(.32); fr=45+90*np.exp(-t*28); x=np.sin(2*np.pi*np.cumsum(fr)/SR)*np.exp(-t*9); x+=noise(len(t))*np.exp(-t*220)*.2; return x*v
def taiko(v=1,low=1.0):
    t=T(.9); fr=(52+40*np.exp(-t*14))*low; x=np.sin(2*np.pi*np.cumsum(fr)/SR)*np.exp(-t*4.5); x+=lp(noise(len(t)),420)*np.exp(-t*20)*.6; x+=np.sin(2*np.pi*fr*1.5*t)*np.exp(-t*9)*.25; return x*v*.95
def snare(v=1):
    t=T(.26); x=bp(noise(len(t)),1300,7500)*np.exp(-t*26)+np.sin(2*np.pi*190*t)*np.exp(-t*30)*.5; return x*v*.7
def hat(v=1,open_=False):
    d=.22 if open_ else .06; t=T(d); return hp(noise(len(t)),7000)*np.exp(-t*(14 if open_ else 70))*v*.25
def swell(d=2.0,v=1):
    t=T(d); x=hp(noise(len(t)),3500)*(t/d)**2*np.exp(-0*t); return x*v*.28
def reverb(buf,sec=2.3,wet=.28,damp=4200):
    n=int(sec*SR); ir=noise(n)*np.exp(-np.arange(n)/SR*(5.2/sec)); ir=lp(ir,damp); ir[:int(.012*SR)]*=np.linspace(0,1,int(.012*SR))
    out=buf.copy()
    for c in range(2):
        irc=np.roll(ir,c*37)*(1 if c==0 else .97); y=signal.fftconvolve(buf[c],irc*.05)[:buf.shape[1]+n]
        wetc=y[:buf.shape[1]].copy(); tail=y[buf.shape[1]:]; wetc[:len(tail)]+=tail      # cauda volta ao início: loop contínuo
        out[c]=buf[c]*(1-wet*.5)+wetc*wet
    return out
def finish(buf,peak=.86):
    buf=np.tanh(buf*1.15); m=np.max(np.abs(buf))+1e-9; return buf/m*peak
def to_mp3(buf,path,br='96k'):
    with tempfile.NamedTemporaryFile(suffix='.wav',delete=False) as tf: w=tf.name
    with wave.open(w,'wb') as wf:
        wf.setnchannels(buf.shape[0]); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes((buf.T*32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',w,'-codec:a','libmp3lame','-b:a',br,path],check=True); os.remove(w)
# ---------- teoria ----------
D=62; MIN=[0,2,3,5,7,8,10]         # ré menor natural
def deg(d,base=D): return base+MIN[d%7]+12*(d//7)
CH={'Dm':[50,57,62,65],'Bb':[46,53,58,62],'F':[53,57,60,65],'C':[48,55,60,64],'A':[45,52,57,61],'Gm':[43,50,55,58]}
BASSN={'Dm':38,'Bb':34,'F':41,'C':36,'A':33,'Gm':31}
CT={'Dm':[0,2,4],'Bb':[5,0,2],'F':[3,5,0],'C':[2,4,6],'A':[4,6,1],'Gm':[1,3,5]}   # graus que são notas do acorde (relativos a ré)

# ---------- instrumentos extras ----------
def choir(ms,d,v=.7):
    t=T(d); x=np.zeros_like(t); vib=1+.005*np.sin(2*np.pi*5*t)
    for m in ms:
        for dt in (-6,0,6): x+=saw(f(m)*vib*2**(dt/1200),t,rng.random())
    y=bp(x,500,900)*1.0+bp(x,1050,1400)*.6+bp(x,2400,2900)*.25
    return y*adsr(len(t),.4,.2,.85,.6)/max(1,len(ms))**.6*v*.5
def pizz(m,v=.8):
    t=T(.5); x=sum(np.sin(2*np.pi*f(m)*k*t)*np.exp(-t*(9+k*5))/k for k in range(1,6)); return x*v*.5
def flute(m,d,v=.8):
    t=T(d); vib=1+.007*np.sin(2*np.pi*5.2*t)*np.minimum(1,t*3)
    x=np.sin(2*np.pi*f(m)*vib*t)+.18*np.sin(4*np.pi*f(m)*vib*t)+bp(noise(len(t)),f(m)*1.5,f(m)*3.5)*.06
    return x*adsr(len(t),.05,.1,.85,.12)*v*.42
def crash(v=1):
    t=T(1.6); return hp(noise(len(t)),5000)*np.exp(-t*2.6)*v*.22
def tom(m,v=1):
    t=T(.4); fr=f(m)*(1+.5*np.exp(-t*25)); return (np.sin(2*np.pi*np.cumsum(fr)/SR)*np.exp(-t*8)+lp(noise(len(t)),900)*np.exp(-t*30)*.3)*v*.8
# ---------- temas compostos (batida, duração em batidas, nota MIDI) ----------
BAT=[(0,.5,69),(.5,.5,74),(1,1,76),(2,.5,77),(2.5,.5,76),(3,1,74),
     (4,.5,70),(4.5,.5,74),(5,1,77),(6,1,79),(7,1,77),
     (8,.5,72),(8.5,.5,77),(9,1,81),(10,.5,79),(10.5,.5,77),(11,1,76),
     (12,1.5,73),(13.5,.5,76),(14,2,69),
     (16,.5,74),(16.5,.5,76),(17,.5,77),(17.5,.5,79),(18,1,81),(19,1,77),
     (20,1,79),(21,.5,77),(21.5,.5,74),(22,2,70),
     (24,.5,77),(24.5,.5,79),(25,1,81),(26,.5,82),(26.5,.5,81),(27,1,77),
     (28,1,76),(29,1,73),(30,2,69)]
BATP=['Dm','Bb','F','A','Dm','Gm','Bb','A']
MEN=[(0,1.5,74),(1.5,.5,72),(2,1,69),(3,1,65),(4,1.5,70),(5.5,.5,69),(6,2,65),
     (8,1,72),(9,1,74),(10,1,77),(11,1,76),(12,3,76),(15,1,72),
     (16,1.5,74),(17.5,.5,76),(18,1,77),(19,1,79),(20,1.5,81),(21.5,.5,79),(22,2,77),
     (24,1,76),(25,1,77),(26,1,76),(27,1,72),(28,3,72),(31,1,69)]
MENP=['Dm','Bb','F','C','Dm','Bb','F','C']
def track(bpm,bars,build):
    spb=60/bpm; buf=np.zeros((2,int(bars*4*spb*SR))); build(buf,spb,bars); return buf
def menu(buf,spb,bars):
    for b in range(bars):
        ch=MENP[b%8]; t0=b*4*spb; sec=b//8
        put(buf,pad(CH[ch],4*spb+.3,.75),t0,.8,-.1)
        if sec>=1: put(buf,choir([m+12 for m in CH[ch][1:]],4*spb+.2,.5),t0,.7,.3)
        put(buf,pizz(BASSN[ch]+12,.9),t0,1,-.1); put(buf,pizz(BASSN[ch]+19,.6),t0+1.5*spb,1,.1); put(buf,pizz(BASSN[ch]+12,.7),t0+2*spb,1)
        arp=[CH[ch][0]+12,CH[ch][1]+12,CH[ch][2]+12,CH[ch][3]+12,CH[ch][2]+12,CH[ch][1]+12,CH[ch][3]+12,CH[ch][2]+12]
        for k in range(8): put(buf,harp(arp[k],1.2,.65),t0+k*spb/2,.8,-.4+k*.1)
        if b%4==0: put(buf,taiko(.45,.9),t0,1)
        if sec>=1: put(buf,hat(.35),t0+1*spb,1,.4); put(buf,hat(.35),t0+3*spb,1,.4)
    for rep in range(bars//8):
        for (s,d,m) in MEN:
            t=(rep*32+s)*spb; put(buf,flute(m+(12 if rep==1 and s>=16 else 0),d*spb*1.05,.9),t,1,.12)
            if rep==1: put(buf,strings([m-12],d*spb,.35),t,.6,-.2)
def prep(buf,spb,bars):
    prog=['Dm','Dm','Bb','A']
    for b in range(bars):
        ch=prog[b%4]; t0=b*4*spb
        put(buf,pad(CH[ch],4*spb+.3,.7),t0,.9)
        for k in range(8): put(buf,strings([CH[ch][0]+12,CH[ch][2]+12],.26,.55,True),t0+k*spb/2,.8,-.2+k*.06)
        put(buf,bass(BASSN[ch],3.6*spb,.8),t0,1)
        for k in (0,2): put(buf,taiko(.6+.1*(k==0),1.0),t0+k*spb,1)
        if b%2==1: put(buf,taiko(.5,1.15),t0+3.5*spb,1)
        if b>=4: put(buf,hat(.5),t0+1.5*spb,1,.3); put(buf,hat(.5),t0+3.5*spb,1,-.3)
        if b%4==3: [put(buf,tom(45+k*2,.6),t0+(3+k*.25)*spb,1,-.3+k*.2) for k in range(4)]
    put(buf,swell(2.4*spb*2,1),(bars*4-4.8)*spb,1)
def battle_build(transpose=0,intense=False):
    def build(buf,spb,bars):
        for b in range(bars):
            ch=BATP[b%8]; t0=b*4*spb; r=[m+transpose for m in CH[ch]]; bn=BASSN[ch]+transpose; sec=b//8
            intro=(b<2) and not intense
            for k in range(8):
                put(buf,bass(bn,.9*spb/2,.95),t0+k*spb/2,1)
                if not intro: put(buf,strings([r[1]+12,r[2]+12] if k%2==0 else [r[0]+12,r[2]+12],.22,.45,True),t0+k*spb/2,.75,-.3+k*.08)
                put(buf,hat(.6+.35*(k%2)),t0+k*spb/2,1,.3)
                if intense: put(buf,hat(.35),t0+k*spb/2+spb/4,1,-.3)
            for k in (0,2): put(buf,kick(.95),t0+k*spb,1)
            if intense: put(buf,kick(.7),t0+2.5*spb,1)
            if not intro:
                for k in (1,3): put(buf,snare(.85),t0+k*spb,1)
            put(buf,taiko(.8,.95),t0,1); put(buf,taiko(.5,1.2),t0+2.5*spb,1)
            if b%8==0: put(buf,crash(1),t0,1)
            if b%4==3:
                for k in range(4): put(buf,tom(50-k*3+transpose,.7),t0+(3+k*.25)*spb,1,.4-k*.25)
            if sec%2==1 or intense: put(buf,choir(r,4*spb+.2,.55),t0,.75)
            else: put(buf,pad(r,4*spb+.3,.55),t0,.9)
        for rep in range(bars//8):
            if rep==0 and not intense: continue
            for (s,d,m) in BAT:
                t=(rep*32+s)*spb; mm=m+transpose
                put(buf,brass(mm,d*spb*.98,.95),t,.95,.1)
                put(buf,lead(mm+12,d*spb,.35),t,.45,-.2)
                if rep%2==1 or intense: put(buf,brass(mm-4 if mm%12 in (2,5,9) else mm-3,d*spb*.98,.55),t,.6,-.25)
    return build
def build_music():
    T0=track(84,16,menu); T0=finish(reverb(T0,2.6,.34)); to_mp3(T0,os.path.join(OUT,'musica-menu.mp3'),'96k')
    T1=track(100,8,prep); T1=finish(reverb(T1,2.2,.3)); to_mp3(T1,os.path.join(OUT,'musica-preparo.mp3'),'88k')
    T2=track(140,32,battle_build()); T2=finish(reverb(T2,1.6,.2)); to_mp3(T2,os.path.join(OUT,'musica-batalha.mp3'),'96k')
    T3=track(158,16,battle_build(2,True)); T3=finish(reverb(T3,1.4,.18)); to_mp3(T3,os.path.join(OUT,'musica-furia.mp3'),'96k')
# ---------- efeitos ----------
def norm(x,p=.8): return x/(np.max(np.abs(x))+1e-9)*p
def chirp(f0,f1,d,curve=1.0):
    t=T(d); fr=f0+(f1-f0)*(t/d)**curve; return np.sin(2*np.pi*np.cumsum(fr)/SR)
def bell(fr,d,v=1.0): t=T(d); return sum(np.sin(2*np.pi*fr*k*t)*np.exp(-t*(6+k*4))*a for k,a in ((1,1),(2.76,.5),(5.4,.25)))*v
def fx_sets():
    S={}
    S['click']=norm(np.sin(2*np.pi*1900*T(.05))*np.exp(-T(.05)*70),.55)
    S['select']=norm(np.concatenate([np.sin(2*np.pi*620*T(.05))*np.exp(-T(.05)*40),np.sin(2*np.pi*930*T(.07))*np.exp(-T(.07)*30)]),.6)
    S['deny']=norm(lp(sqr(150,T(.2))*adsr(int(.2*SR),.005,.05,.7,.08),900),.5)
    t=T(.4); S['spawn']=norm(lp(noise(len(t)),1400)*np.exp(-t*12)*.8+chirp(300,1100,.4)*np.exp(-t*7)*.5+bell(1600,.4)*.3,.7)
    for i,(fm,fr) in enumerate(((1,1900),(1.18,2300),(.86,1500))):
        t=T(.34); n=hp(noise(len(t)),1800)*np.exp(-t*220)
        ring=sum(np.sin(2*np.pi*fr*k*t)*np.exp(-t*(16+k*9))*a for k,a in ((1,1),(1.5,.6),(2.3,.4)))
        S['sword%d'%(i+1)]=norm(n*.9+ring*.55+lp(noise(len(t)),400)*np.exp(-t*60)*.5,.8)
    for i,fr in enumerate((70,58)):
        t=T(.4); S['punch%d'%(i+1)]=norm(np.sin(2*np.pi*(fr+60*np.exp(-t*30))*t)*np.exp(-t*9)+lp(noise(len(t)),700)*np.exp(-t*32)*.8+hp(noise(len(t)),2500)*np.exp(-t*160)*.3,.9)
    for i,(a,b) in enumerate(((2400,500),(3000,650))):
        t=T(.24); sweep=bp(noise(len(t)),a*.5,a*1.4)*np.exp(-t*9)*(1-np.exp(-t*80))+bp(noise(len(t)),b,b*2)*np.exp(-t*14)*.5
        S['arrow%d'%(i+1)]=norm(sweep+bell(1200+i*200,.24)*.12,.6)
    t=T(.2); S['arrowhit']=norm(lp(noise(len(t)),1500)*np.exp(-t*60)+np.sin(2*np.pi*190*t)*np.exp(-t*40)*.6,.7)
    t=T(.9); S['cannon']=norm(np.sin(2*np.pi*np.cumsum(140*np.exp(-t*4.5)+34)/SR)*np.exp(-t*4.2)+lp(noise(len(t)),900)*np.exp(-t*7)*.9+hp(noise(len(t)),3000)*np.exp(-t*80)*.35,.95)
    t=T(.38); S['balista']=norm(hp(noise(len(t)),600)*np.exp(-t*30)*.7+np.sin(2*np.pi*np.cumsum(260*np.exp(-t*7)+90)/SR)*np.exp(-t*12)*.9+bp(noise(len(t)),1500,5000)*np.exp(-t*12)*.4,.8)
    t=T(.45); S['magic']=norm(chirp(380,1500,.45,.7)*np.exp(-t*4)*.7+bell(1760,.45)*.35+bp(noise(len(t)),3000,9000)*np.exp(-t*8)*.25,.65)
    t=T(.4); S['magichit']=norm(bell(780,.4)*.7+lp(noise(len(t)),2400)*np.exp(-t*28)*.6+np.sin(2*np.pi*120*t)*np.exp(-t*15)*.5,.7)
    t=T(.75); S['fire_cast']=norm(bp(noise(len(t)),400,3000)*np.sin(np.pi*np.minimum(1,t/.75))**1.2*.9+lp(noise(len(t)),300)*.5*np.exp(-t*3),.75)
    t=T(1.6); S['explosion']=norm(np.sin(2*np.pi*np.cumsum(120*np.exp(-t*3)+30)/SR)*np.exp(-t*2.6)*1.0+lp(noise(len(t)),1100)*np.exp(-t*3.2)*1.0+hp(noise(len(t)),2600)*np.exp(-t*30)*.5+lp(noise(len(t)),220)*np.exp(-t*1.4)*.7,.95)
    t=T(.55); z=np.zeros_like(t)
    for k in range(7): s=int(rng.random()*.35*SR); seg=hp(noise(int(.07*SR)),1800)*np.exp(-T(.07)*45); z[s:s+len(seg)]+=seg[:len(z)-s]
    S['lightning']=norm(z*.9+np.sin(2*np.pi*np.cumsum(2400*np.exp(-t*30)+300)/SR)*np.exp(-t*12)*.6+hp(noise(len(t)),5000)*np.exp(-t*60)*.7,.8)
    t=T(2.2); S['thunder']=norm(lp(noise(len(t)),260)*(np.exp(-t*1.1))*(1+.6*np.sin(2*np.pi*3.2*t))+lp(noise(len(t)),900)*np.exp(-t*3)*.7+hp(noise(len(t)),4000)*np.exp(-t*70)*.4,.9)
    S['heal']=norm(np.concatenate([bell(f(m),.34 if i<3 else .9)[:int(.15*SR) if i<3 else None] if False else np.pad(bell(f(m),.7)[:int((.14 if i<3 else .7)*SR)],(0,0)) for i,m in enumerate((72,76,79,84))]),.6)
    t=T(.7); S['ice']=norm(hp(noise(len(t)),3500)*np.exp(-t*25)*.6+sum(np.sin(2*np.pi*fr*t)*np.exp(-t*(5+i*2))*a for i,(fr,a) in enumerate(((2093,.8),(3136,.6),(4186,.5),(5274,.3))))*.5+chirp(900,300,.7)*np.exp(-t*20)*.3,.7)
    t=T(.9); S['silence']=norm(chirp(900,140,.9,.6)*np.exp(-t*2.5)*(1+.5*np.sin(2*np.pi*14*t))*.8+lp(noise(len(t)),600)*np.exp(-t*6)*.3,.6)
    t=T(.5); S['thorns']=norm(hp(noise(len(t)),1200)*np.exp(-t*20)*.8+lp(noise(len(t)),300)*np.exp(-t*9)*.9+np.sin(2*np.pi*95*t)*np.exp(-t*12)*.6,.8)
    t=T(1.0); S['rune']=norm(sum(np.sin(2*np.pi*fr*t) for fr in (220,330,442))*np.sin(np.pi*np.minimum(1,t))**1.5*.3+bell(1320,1.0)*.4+chirp(200,900,1.0,2)*np.exp(-t*3)*.25,.65)
    t=T(.6); S['net']=norm(bp(noise(len(t)),500,4500)*np.sin(np.pi*np.minimum(1,t/.6))**.8*.8+hp(noise(len(t)),3000)*np.exp(-t*8)*.3,.6)
    t=T(.5); S['die']=norm(chirp(520,110,.5,.8)*np.exp(-t*7)*.7+lp(noise(len(t)),1500)*np.exp(-t*14)*.6+bell(1100,.5)*.15,.7)
    t=T(.3); S['build_hit']=norm(lp(noise(len(t)),1600)*np.exp(-t*30)+np.sin(2*np.pi*(110+60*np.exp(-t*40))*t)*np.exp(-t*16)*.8+hp(noise(len(t)),3500)*np.exp(-t*140)*.3,.75)
    t=T(1.5); S['build_die']=norm(lp(noise(len(t)),700)*np.exp(-t*2.3)*(1+.7*np.sin(2*np.pi*9*t))+np.sin(2*np.pi*np.cumsum(90*np.exp(-t*3)+30)/SR)*np.exp(-t*3)*.9+hp(noise(len(t)),2500)*np.exp(-t*20)*.5,.9)
    t=T(2.8); S['heart_die']=norm(S['explosion'].copy().repeat(1)[:len(t)].tolist() and np.concatenate([S['explosion'],np.zeros(max(0,len(t)-len(S['explosion'])))])[:len(t)]+lp(noise(len(t)),400)*np.exp(-t*1.1)*1.0+np.sin(2*np.pi*np.cumsum(70*np.exp(-t*1.6)+26)/SR)*np.exp(-t*1.2)*.8,.95)
    t=T(.13); S['pop']=norm(np.sin(2*np.pi*(180+120*np.exp(-t*40))*t)*np.exp(-t*30)+lp(noise(len(t)),1800)*np.exp(-t*60)*.6,.7)
    t=T(.06); S['tick']=norm(np.sin(2*np.pi*1200*t)*np.exp(-t*60),.5)
    t=T(.3); S['swap']=norm(bp(noise(len(t)),900,5000)*np.sin(np.pi*np.minimum(1,t/.3))*.6+chirp(500,900,.3)*.15,.5)
    t=T(.35); S['throw']=norm(bp(noise(len(t)),300,2000)*np.sin(np.pi*np.minimum(1,t/.35))*.8+chirp(300,700,.35)*np.exp(-t*8)*.2,.55)
    t=T(.6); S['charge']=norm(np.concatenate([np.zeros(1)])[:0].sum()+lp(noise(len(t)),900)*np.exp(-t*9)+np.sin(2*np.pi*(80+80*np.exp(-t*20))*t)*np.exp(-t*7)*1.1+hp(noise(len(t)),2500)*np.exp(-t*50)*.5+sum(np.sin(2*np.pi*fr*t)*np.exp(-t*12)*.3 for fr in (1700,2550)),.95)
    t=T(.35); S['crit']=norm(sum(np.sin(2*np.pi*fr*t)*np.exp(-t*(10+i*3))*a for i,(fr,a) in enumerate(((2637,1),(3951,.6),(5274,.4))))+hp(noise(len(t)),5000)*np.exp(-t*80)*.6,.6)
    t=T(.9); S['rage']=norm(lp(saw(90,t)+saw(91.5,t),700)*np.sin(np.pi*np.minimum(1,t/.9))*.7+sum(np.sin(2*np.pi*(300+200*k)*t+k)*np.exp(-((t-.1*k-.1)**2)/.002)*.4 for k in range(6)),.75)
    lv=np.zeros(int(.9*SR))
    for k,m in enumerate((72,76,79,84,88)):
        b2=bell(f(m),.5,.8); st=int(k*.08*SR); lv[st:st+len(b2)]+=b2[:len(lv)-st]
    S['levelup']=norm(lv,.6)
    t=T(1.6); S['shockwave']=norm(np.sin(2*np.pi*np.cumsum(70*np.exp(-t*2)+25)/SR)*np.exp(-t*2.2)*1.2+bp(noise(len(t)),200,1800)*np.exp(-t*3)*np.minimum(1,t*20)*.8+bell(440,1.6)*.25,.95)
    # fanfarra "Já!" e jingles
    b=np.zeros((2,int(1.4*SR)))
    for st,m,d in ((0,57,.3),(.28,62,.3),(.56,69,.8)): put(b,brass(m,d,1),st,1); put(b,brass(m-12,d,.7),st,.8)
    put(b,taiko(.9,1),0,1); put(b,swell(.5,.7),.1,.6); S['horn']=norm(finish(reverb(b,1.2,.2))[0],.85)
    w=np.zeros((2,int(4.2*SR)))
    for st,m,d in ((0,62,.4),(.35,66,.4),(.7,69,.4),(1.05,74,1.4)): put(w,brass(m,d,1),st,1); put(w,strings([m-12,m-5],d+.2,.6),st,.7); put(w,bell(f(m+12),1.2,.6),st,.6)
    put(w,taiko(.9,1),0,1); put(w,taiko(.9,1),1.05,1); put(w,swell(.9,1),.2,.6); S['win']=norm(finish(reverb(w,2.0,.3))[0],.85)
    l=np.zeros((2,int(4.0*SR)))
    for st,m,d in ((0,62,.7),(.65,60,.7),(1.3,57,.7),(1.95,50,1.8)): put(l,strings([m,m-5],d+.3,.8),st,1); put(l,lead(m,d,.6),st,.5)
    put(l,taiko(.9,.8),0,1); put(l,taiko(1,.7),1.95,1); S['lose']=norm(finish(reverb(l,2.2,.32))[0],.85)
    return S
def build_sfx():
    S=fx_sets(); gap=int(.08*SR); cur=0; chunks=[]; idx={}
    for k,v in S.items():
        v=np.asarray(v,dtype=float); v=v*np.minimum(1,np.arange(len(v))/(.004*SR+1)); v[-int(.01*SR):]*=np.linspace(1,0,int(.01*SR))
        idx[k]=[round(cur/SR,3),round(len(v)/SR,3)]; chunks+= [v,np.zeros(gap)]; cur+=len(v)+gap
    all_=np.concatenate(chunks); to_mp3(np.stack([all_,all_]),os.path.join(OUT,'sfx.mp3'),'80k')
    json.dump(idx,open(os.path.join(OUT,'sfx.json'),'w'))
    print('efeitos:',len(idx),'duração total',round(cur/SR,1),'s')
if __name__=='__main__':
    build_sfx(); build_music()
    for n in sorted(os.listdir(OUT)): print(n,round(os.path.getsize(os.path.join(OUT,n))/1024),'KB')
