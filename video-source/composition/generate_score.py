"""Create an original, restrained 21-second electronic score for OmniPi."""
import math, wave, struct
from pathlib import Path
rate=44100
seconds=21
out=Path(__file__).parent/'assets/score.wav'
with wave.open(str(out),'wb') as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate)
    buf=bytearray()
    for n in range(rate*seconds):
        t=n/rate
        fade=min(1,t/1.0,(seconds-t)/1.2)
        fade=max(0,fade)
        chord=(math.sin(2*math.pi*110*t)+.46*math.sin(2*math.pi*164.81*t)+.33*math.sin(2*math.pi*220*t))*.11
        pulse=(math.sin(2*math.pi*55*t)*.075) * (max(0,1-(t*1.9)%1)**4)
        accents=0
        for hit in (1.6,5.8,9.5,14.75,18.3):
            d=t-hit
            if 0<=d<.48: accents+=.14*math.exp(-11*d)*math.sin(2*math.pi*(520-150*d)*d)
        sample=max(-1,min(1,(chord+pulse+accents)*fade))
        buf+=struct.pack('<h',int(sample*32767))
    w.writeframes(buf)
print(out)
