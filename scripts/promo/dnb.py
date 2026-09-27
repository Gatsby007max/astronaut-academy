"""180 BPM dancefloor DnB: deterministic synthesis, no external audio assets."""
from pathlib import Path
import json
import wave
import numpy as np

RATE=48000
BPM=180
BEAT=60/BPM
BAR=BEAT*4
DURATION=15
N=RATE*DURATION

def hz(midi):
    return 440*2**((midi-69)/12)

def write_wav(path,signal):
    with wave.open(str(path),'wb') as out:
        out.setnchannels(2);out.setsampwidth(2);out.setframerate(RATE)
        out.writeframes(np.rint(np.clip(signal,-1,1)*32767).astype('<i2').tobytes())

def produce(out:Path):
    out.mkdir(parents=True,exist_ok=True)
    rng=np.random.default_rng(18020260927)
    drums=np.zeros((N,2));bass=np.zeros((N,2));music=np.zeros((N,2));space=np.zeros((N,2))
    kick_times=[];events=[]

    def add(bus,signal,at,level=1,pan=0,kind=None,midi=None):
        start=round(at*RATE);length=min(len(signal),N-start)
        if length<=0:return
        if signal.ndim==1:
            gains=np.array([np.cos((pan+1)*np.pi/4),np.sin((pan+1)*np.pi/4)])
            bus[start:start+length]+=signal[:length,None]*gains*level
        else:
            bus[start:start+length]+=signal[:length]*level
        if kind:events.append({'instrument':kind,'seconds':round(at,6),'sample':start,'level':level,**({'midi':midi} if midi is not None else {})})

    def times(duration):
        return np.arange(round(RATE*duration))/RATE

    def band_noise(duration,lo,hi):
        size=round(RATE*duration)
        f=np.fft.rfftfreq(size,1/RATE)
        response=(1+(lo/np.maximum(f,1))**8)**-.5*(1+(f/hi)**8)**-.5
        spectrum=np.fft.rfft(rng.standard_normal(size))*response
        result=np.fft.irfft(spectrum,n=size)
        return result/max(np.sqrt(np.mean(result**2)),1e-9)

    def edge(t,duration,attack=.002,release=.035):
        return np.minimum(1,t/attack)*np.sin(np.minimum(1,np.maximum(0,(duration-t)/release))*np.pi/2)**2

    def kick(at,level=1):
        t=times(.27)
        phase=2*np.pi*(52*t+100*.016*(1-np.exp(-t/.016)))
        body=np.sin(phase)*np.exp(-t*15)
        punch=.15*np.sin(2*np.pi*(110*t+70*.010*(1-np.exp(-t/.01))))*np.exp(-t*55)
        click=band_noise(.27,1100,3800)*np.exp(-t*290)*.026
        signal=np.tanh((body+punch)*1.3)/1.3+click
        add(drums,signal*edge(t,.27,.0007)*.65,at,level,kind='kick')
        kick_times.append(at)

    def snare(at,level=1,short=False):
        duration=.105 if short else .205;t=times(duration)
        fundamental=np.sin(2*np.pi*(184*t+38*.012*(1-np.exp(-t/.012))))*np.exp(-t*27)
        rim=.21*np.sin(2*np.pi*337*t)*np.exp(-t*58)
        # Short, band-limited snare texture; the cymbal spectrum stays restrained.
        snap=band_noise(duration,1050,5800)*np.exp(-t*31)*.22
        signal=(fundamental*.55+rim+snap)*edge(t,duration,.0009,.032)
        add(drums,np.tanh(signal*1.35)/1.35,at,level*.59,kind='snare')

    def hat(at,level=1,opened=False,pan=0):
        duration=.19 if opened else .055;t=times(duration)
        tick=band_noise(duration,4400,8400)
        metallic=sum(np.sin(2*np.pi*f*t) for f in [3137,4271,5693,6821])/4
        signal=(tick*.75+metallic*.25)*np.exp(-t*(25 if opened else 83))*edge(t,duration,.0014,.025)
        add(drums,signal*.055,at,level,pan,kind='open_hat' if opened else 'hat')

    def tom(at,midi,level=.22):
        t=times(.15);f=hz(midi)
        signal=np.sin(2*np.pi*(f*t+f*.35*.015*(1-np.exp(-t/.015))))*np.exp(-t*27)*edge(t,.15)
        add(drums,signal,at,level,pan=-.12 if midi>48 else .12,kind='tom',midi=midi)

    def bass_note(at,midi,duration,level=1):
        t=times(duration);f=hz(midi)
        envelope=edge(t,duration,.004,.04)
        sub=np.sin(2*np.pi*f*t)*.25
        # Band-limited detuned harmonics carry the note on small speakers.
        cutoff=420+850*np.exp(-t*10)+110*np.sin(2*np.pi*3*t)
        mid=np.zeros(len(t))
        for harmonic in range(1,19):
            gain=np.exp(-(2*f*harmonic/cutoff)**2)/harmonic
            phase=2*np.pi*(2*f*harmonic)*t
            mid+=(np.sin(phase*1.0023+.3)+np.sin(phase*.9977-.3))*.5*gain
        mid=np.tanh(mid*1.45)*.19
        add(bass,(sub+mid)*envelope,at,level,kind='bass',midi=midi)

    def lead(at,midi,level=.12,duration=.24,pan=0):
        t=times(duration);f=hz(midi)
        tone=np.zeros(len(t))
        for detune in [-.0028,0,.0028]:
            for harmonic in range(1,9):
                spectral=np.exp(-(harmonic*f/(1300+2500*np.exp(-t*16)))**2)
                tone+=np.sin(2*np.pi*f*harmonic*(1+detune)*t+.21*harmonic)*spectral/(harmonic*3)
        tone=np.tanh(tone*1.3)*np.exp(-t*5)*edge(t,duration,.008,.07)
        add(music,tone,at,level,pan,kind='hook',midi=midi)
        add(space,tone,at+BEAT*.75,level*.16,-pan)
        add(space,tone,at+BEAT*1.5,level*.06,pan)

    def chord(at,notes,duration,level=.035):
        t=times(duration)
        envelope=edge(t,duration,.022,.16)*np.exp(-t*.65)
        stereo=np.zeros((len(t),2))
        for i,midi in enumerate(notes):
            f=hz(midi)
            for side,detune in enumerate([-.0013,.0013]):
                stereo[:,side]+=(np.sin(2*np.pi*f*(1+detune)*t+i*.7)+.2*np.sin(2*np.pi*f*2*t))
        add(music,stereo*envelope[:,None],at,level,kind='chord')

    # Bar 1: one-bar introduction. The beat is identifiable immediately.
    kick(0,.72);kick(2.5*BEAT,.45)
    snare(BEAT,.52);snare(3*BEAT,.66)
    for tick in range(8):hat(tick*BEAT/2,.50 if tick%2 else .35,pan=(-1)**tick*.18)
    chord(0,[62,65,69,76],BAR,.018)
    for at,midi in [(0,74),(.5*BEAT,81),(2*BEAT,77),(3.5*BEAT,76)]:lead(at,midi,.07,.18)
    bass_note(0,26,.25,.5)

    # Bars 2–8: two-step drums, syncopated bass, alternating two-bar hooks.
    motif_a=[(0,74),(.75,81),(1.5,77),(2.5,76),(3.25,74)]
    motif_b=[(.25,72),(1,74),(1.75,77),(2.5,76),(3.5,69)]
    for bar in range(1,8):
        at=bar*BAR
        for beat in ([0,1.75,2.5] if bar%2 else [0,.75,2.5]):kick(at+beat*BEAT,.95 if beat==0 else .80)
        for beat in [1,3]:snare(at+beat*BEAT)
        for beat in ([2.75,3.75] if bar%2 else [.75,2.25]):snare(at+beat*BEAT,.17,True)
        for tick in range(8):hat(at+tick*BEAT/2,.70 if tick%2 else .40,pan=(-1)**tick*.20)
        for beat in [1.75,3.75]:hat(at+beat*BEAT,.24,pan=.28)
        if bar%2==0:hat(at+2.5*BEAT,.44,True,-.22)
        root=[26,26,29,24,26,26,29][bar-1]
        third={26:29,29:33,24:28}[root]
        for beat,length,note,velocity in [(0,.78,root,1),(1.5,.40,root+12,.65),(2,.65,root,.9),(3.25,.52,third,.74)]:
            bass_note(at+beat*BEAT,note,length*BEAT,velocity)
        for beat,note in (motif_a if bar%2 else motif_b):lead(at+beat*BEAT,note,.095,.26,(-1)**int(beat*4)*.17)
        if bar in [1,3,5,7]:chord(at,[50,57,62,65,69],.60,.024)

    # Bar 9: a one-bar drum fill resolves exactly at the title's frame 360.
    fill=8*BAR
    kick(fill,.88);snare(fill+BEAT,.70)
    bass_note(fill,26,.52,.70)
    for j,beat in enumerate([2,2.5,2.75,3,3.25,3.5,3.75]):
        snare(fill+beat*BEAT,.24+j*.055,True)
        if j%2==0:tom(fill+beat*BEAT,53-j*2,.20)
    for tick in range(8):hat(fill+tick*BEAT/2,.32)
    lead(fill,81,.09,.32,-.18);lead(fill+2*BEAT,84,.065,.20,.18)

    # Bars 10–11: title hit and hook reprise, then a 1/3-second release.
    for bar in [9,10]:
        at=bar*BAR
        for beat in [0,1.75,2.5]:kick(at+beat*BEAT,1 if beat==0 else .78)
        for beat in [1,3]:snare(at+beat*BEAT,.94)
        for tick in range(8):hat(at+tick*BEAT/2,.62 if tick%2 else .32,pan=(-1)**tick*.15)
        for beat,length in [(0,.85),(1.5,.37),(2,.70),(3.25,.57)]:bass_note(at+beat*BEAT,26,length*BEAT,.98)
        for beat,note in motif_a:lead(at+beat*BEAT,note,.115,.28,(-1)**int(beat*4)*.18)
    chord(12,[50,57,62,65,69,76],3,.043)
    t=times(.55)
    hit=np.sin(2*np.pi*(36.708*t+55*.03*(1-np.exp(-t/.03))))*np.exp(-t*9)*edge(t,.55,.003)
    add(bass,hit,12,.20,kind='title_accent',midi=26)

    # Kick-triggered ducking leaves room for the kick without boosting volume.
    duck=np.ones(N)
    for at in kick_times:
        start=round(at*RATE);t=times(.22);length=min(len(t),N-start)
        gain=1-.62*np.exp(-t[:length]/.060)
        duck[start:start+length]=np.minimum(duck[start:start+length],gain)
    bass*=duck[:,None]
    music*=(.78+.22*duck[:,None])
    mix=drums+bass+music+space
    # Low-level harmonic pad holds the final release after the groove stops.
    tail=np.arange(N)/RATE
    fade=np.sin(np.clip((15-tail)/(1/3),0,1)*np.pi/2)**2
    fade*=np.sin(np.clip(tail/.003,0,1)*np.pi/2)**2
    mix*=fade[:,None]
    mix[0]=mix[-1]=0
    peak=float(np.max(np.abs(mix)))
    mix*=10**(-4/20)/max(peak,1e-9)
    assert mix.shape==(720000,2) and np.isfinite(mix).all()
    write_wav(out/'score-original.wav',mix)
    report={
        'style':'dancefloor-dnb','bpm':BPM,'key':'D minor','sampleRate':RATE,
        'durationSeconds':DURATION,'channels':2,'samplesPerChannel':N,
        'sections':[{'name':n,'start':a,'end':b} for n,a,b in [
            ('intro',0,4/3),('main',4/3,32/3),('fill',32/3,12),('title',12,44/3),('release',44/3,15)]],
        'titleCue':{'seconds':12,'sample':576000,'videoFrame':360},
        'source':'Deterministic mathematical synthesis; no external recordings or samples',
        'events':sorted(events,key=lambda e:e['sample']),
        'rawPeakDbFS':float(20*np.log10(np.max(np.abs(mix)))),
    }
    (out/'score-manifest.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:report[k] for k in ['style','bpm','key','durationSeconds','titleCue','rawPeakDbFS']}))
