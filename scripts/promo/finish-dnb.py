"""Master, mux and verify the DnB edition without re-encoding the picture."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import numpy as np

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'output/promo-15s-en-dnb'
SOURCE=ROOT/'output/promo-15s-en/astronaut-academy-15s-en-silent.mp4'
MOVIE=OUT/'astronaut-academy-15s-en-dnb.mp4'
FFMPEG='/opt/homebrew/bin/ffmpeg'
FFPROBE='/opt/homebrew/bin/ffprobe'

def run(args):
    return subprocess.run(args,check=True,capture_output=True)

def loudness(path,log):
    result=run([FFMPEG,'-hide_banner','-i',str(path),'-vn','-af','loudnorm=I=-18:TP=-2.3:LRA=7:print_format=json','-f','null','-'])
    text=result.stderr.decode();(OUT/log).write_text(text)
    return json.loads(text[text.index('{'):text.index('}')+1])

def pcm(path):
    data=run([FFMPEG,'-v','error','-i',str(path),'-vn','-ar','48000','-ac','2','-f','f32le','pipe:1']).stdout
    return np.frombuffer(data,dtype='<f4').reshape(-1,2)

def db(value):
    return float(20*np.log10(max(float(value),1e-12)))

def video_hash(path):
    data=run([FFMPEG,'-v','error','-i',str(path),'-map','0:v:0','-c:v','copy','-bsf:v','h264_mp4toannexb','-f','h264','pipe:1']).stdout
    return hashlib.sha256(data).hexdigest()

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    measured=loudness(OUT/'score-original.wav','loudnorm-pass1.log')
    settings=':'.join([
        'loudnorm=I=-18:TP=-2.3:LRA=7',
        f"measured_I={measured['input_i']}",f"measured_TP={measured['input_tp']}",
        f"measured_LRA={measured['input_lra']}",f"measured_thresh={measured['input_thresh']}",
        f"offset={measured['target_offset']}",'linear=true','print_format=json',
    ])
    result=run([FFMPEG,'-hide_banner','-y','-i',str(OUT/'score-original.wav'),'-af',settings,'-ar','48000','-c:a','pcm_s24le',str(OUT/'score-master.wav')])
    (OUT/'loudnorm-pass2.log').write_bytes(result.stderr)
    result=run([FFMPEG,'-hide_banner','-y','-i',str(SOURCE),'-i',str(OUT/'score-master.wav'),
        '-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000',
        '-t','15','-movflags','+faststart','-metadata','title=Astronaut Academy — Dancefloor DnB / 180 BPM',str(MOVIE)])
    (OUT/'mux.log').write_bytes(result.stderr)
    info=json.loads(run([FFPROBE,'-v','error','-show_streams','-show_format','-of','json',str(MOVIE)]).stdout)
    (OUT/'media-info.json').write_text(json.dumps(info,indent=2)+'\n')
    video=next(s for s in info['streams'] if s['codec_type']=='video')
    audio=next(s for s in info['streams'] if s['codec_type']=='audio')
    assert (video['width'],video['height'],video['avg_frame_rate'],video['nb_frames'])==(1920,1080,'30/1','450')
    assert float(info['format']['duration'])==15
    assert (audio['codec_name'],audio['channels'],audio['sample_rate'])==('aac',2,'48000')
    original_hash=video_hash(SOURCE);final_hash=video_hash(MOVIE)
    assert original_hash==final_hash,'Picture stream changed'
    levels=loudness(MOVIE,'encoded-loudness.log')
    assert abs(float(levels['input_i'])+18)<=.5,levels
    assert float(levels['input_tp'])<=-2,levels
    master=pcm(OUT/'score-master.wav');encoded=pcm(MOVIE)
    assert master.shape==(720000,2)
    assert np.isfinite(master).all() and np.isfinite(encoded).all()
    assert np.max(np.abs(master))<1 and np.max(np.abs(encoded))<1
    assert np.max(np.abs(master[-48:]))<1e-4,'Abrupt ending'
    assert np.max(np.abs(master[0]))<1e-4,'Abrupt start'
    # Difference threshold detects a discontinuity much larger than any designed transient.
    jump=float(np.max(np.abs(np.diff(master,axis=0))))
    assert jump<.35,f'Unexpected waveform discontinuity: {jump}'
    cue=12*48000
    before=np.sqrt(np.mean(master[cue-960:cue]**2))
    after=np.sqrt(np.mean(master[cue:cue+1600]**2))
    assert after>before,'Title accent is not audible in the waveform'
    manifest=json.loads((OUT/'score-manifest.json').read_text())
    assert manifest['bpm']==180 and manifest['titleCue']=={'seconds':12,'sample':576000,'videoFrame':360}
    assert any(e['instrument']=='title_accent' and e['sample']==576000 for e in manifest['events'])
    report={
        'durationSeconds':15,'width':1920,'height':1080,'fps':30,'frames':450,'language':'en','shotCount':14,
        'videoStreamSha256':final_hash,'sourceVideoStreamSha256':original_hash,'videoStreamIdentical':True,
        'audio':{'bpm':180,'style':'dancefloor-dnb','key':'D minor','sampleRate':48000,'channels':2,
            'integratedLufs':float(levels['input_i']),'truePeakDbTP':float(levels['input_tp']),
            'loudnessRangeLU':float(levels['input_lra']),'clippedSamples':int(np.count_nonzero(np.abs(encoded)>=1)),
            'masterSamplesPerChannel':len(master),'masterLastMillisecondPeakDbFS':db(np.max(np.abs(master[-48:]))),
            'maxAdjacentSampleDelta':jump,'titleCueSeconds':12,'titleVideoFrame':360,
            'titleRmsRiseDb':db(after)-db(before)},
        'checks':'PASS','browserPlayback':'pending',
    }
    (OUT/'audio-verification.json').write_text(json.dumps(report,indent=2)+'\n')
    for name in ['poster.jpg','render-report.json']:
        shutil.copy2(ROOT/'output/promo-15s-en'/name,OUT/name)
    print(json.dumps(report))

if __name__=='__main__':main()
