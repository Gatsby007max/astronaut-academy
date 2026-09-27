"""Original, deterministic 15-second score. No external samples or recordings."""
from pathlib import Path
import argparse
import wave
import numpy as np

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--en',action='store_true',help='Use the English film timing')
parser.add_argument('--style',choices=['tonal','dancefloor-dnb'],default='tonal')
args=parser.parse_args()
if args.style=='dancefloor-dnb':
    if not args.en:
        parser.error('dancefloor-dnb is arranged for the English film; add --en')
    from dnb import produce
    produce(Path('output/promo-15s-en-dnb'))
    raise SystemExit(0)

RATE=48000
DURATION=15
english=args.en
ending=12.0 if english else 11.6
mix=np.zeros((RATE*DURATION,2),dtype=np.float64)
def add(signal,at,pan=0):
    start=round(at*RATE)
    end=min(len(mix),start+len(signal))
    if end<=start:return
    gains=np.array([np.cos((pan+1)*np.pi/4),np.sin((pan+1)*np.pi/4)])
    mix[start:end]+=signal[:end-start,None]*gains[None,:]
def note(midi):return 440*2**((midi-69)/12)
def pluck(midi,at,amp=.085,duration=1.5,pan=0):
    t=np.arange(int(RATE*duration))/RATE
    f=note(midi)
    signal=(np.sin(2*np.pi*f*t)+.23*np.sin(2*np.pi*2*f*t)*np.exp(-t*6)+.08*np.sin(2*np.pi*3*f*t)*np.exp(-t*9))
    signal*=np.minimum(1,t/.012)*np.exp(-t*3)*np.minimum(1,(duration-t)/.16)*amp
    add(signal,at,pan)
    for delay,gain in [(.25,.22),(.5,.1),(.75,.04)]:add(signal*gain,at+delay,-pan)

# D minor ninth, warm sine bed with slow stereo beating.
whole=np.arange(RATE*DURATION)/RATE
envelope=np.minimum(1,whole/1.5)*np.minimum(1,(DURATION-whole)/1.3)
for i,midi in enumerate([50,57,60,64,65]):
    freq=note(midi)
    for side,offset in enumerate([-.10,.10]):
        mix[:,side]+=np.sin(2*np.pi*(freq+offset)*whole+i*.72)*envelope*.018*(.8+.2*np.sin(whole*.75+i))

# Soft low pulses and short tuned impacts at the edit points.
for beat,at in enumerate(np.arange(.0,ending if english else 11.5,.45 if english else .5)):
    t=np.arange(int(RATE*.44))/RATE
    phase=2*np.pi*(48*t+48*.045*(1-np.exp(-t/.045)))
    amp=.14 if beat%2==0 else .065
    add(np.sin(phase)*np.exp(-t*11)*np.minimum(1,t/.004)*amp,float(at))
cuts=[round(i*.9,1) for i in range(13)]+[12.0] if english else [0,3.5,6.5,9.5,11.6]
for at in cuts:
    t=np.arange(int(RATE*1.25))/RATE
    phase=2*np.pi*(note(38)*t+85*.05*(1-np.exp(-t/.05)))
    impact=(.15 if at in [0,ending] else .09) if english else .18
    add(np.sin(phase)*np.minimum(1,t/.01)*np.exp(-t*4.8)*impact,at)
    pluck(86,at,.024,.8,.4)

events=[(0.5,62),(1.25,69),(2,72),(2.75,76),(3.5,69),(4.25,72),(5,74),(5.75,69),(6.5,65),(7.25,69),(8,72),(8.75,76),(9.5,74),(10.0,72),(10.5,69),(11,65),(11.6,74),(12.35,81),(13.1,86)]
if english:
    motif=[62,69,72,76,69,72,74,69,65,69,72,76]
    events=[(.45+i*.45,motif[i%len(motif)]) for i in range(25)]+[(12.0,74),(12.6,81),(13.2,86)]
for i,(at,midi) in enumerate(events):
    pluck(midi,at,(.065 if english else .071) if at<ending else .085,1.7,(i%3-1)*.28)

# Long ending chord with a rounded tail; no hard cut at 15 seconds.
for i,midi in enumerate([50,57,62,69,76]):
    t=np.arange(round(RATE*(15-ending)))/RATE
    signal=np.sin(2*np.pi*note(midi)*t)*np.minimum(1,t/.14)*np.exp(-t*.7)*.032
    add(signal,ending,(i-2)*.18)
mix*=np.minimum(1,whole/.045)[:,None]*np.minimum(1,(DURATION-whole)/.9)[:,None]
peak=np.max(np.abs(mix))
mix*=.68/max(peak,.68)
target=Path('output/promo-15s-en/score-original.wav' if english else 'output/promo-15s/score-original.wav')
with wave.open(str(target),'wb') as out:
    out.setnchannels(2);out.setsampwidth(2);out.setframerate(RATE)
    out.writeframes(np.clip(mix*32767,-32768,32767).astype('<i2').tobytes())
print(target, 'peak dBFS',round(float(20*np.log10(np.max(np.abs(mix)))),2))
