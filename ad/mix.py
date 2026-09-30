import subprocess
F=open('/tmp/ffpath').read().strip()
SC=[0,7,11.5,15,19.5,24.5,28.5,32.5,36.5,40.5,46.5,49,54]
OFF={i:0.35 for i in range(13)}; OFF[10]=0.2
inp=[];fl=[]
for i in range(13):
    inp+=['-i',f'vo/s{i}_t.wav']
    ms=int((SC[i]+OFF[i])*1000)
    fl.append(f'[{i}:a]atempo=1.06,highpass=f=90,aresample=44100,aformat=channel_layouts=stereo,adelay={ms}|{ms},apad=whole_dur=60[v{i}]')
inp+=['-i','music.wav']
fl.append(''.join(f'[v{i}]' for i in range(13))+'amix=inputs=13:normalize=0:duration=first,alimiter=limit=0.95,volume=1.6[vo]')
fl.append('[vo]asplit=2[vo1][vo2]')
fl.append('[13:a]volume=0.62[m]')
fl.append('[m][vo1]sidechaincompress=threshold=0.02:ratio=7:attack=15:release=400:makeup=1[md]')
fl.append('[md][vo2]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=9[out]')
cmd=[F,'-y','-loglevel','error']+inp+['-filter_complex',';'.join(fl),'-map','[out]','-t','60','-ar','44100','ad60.wav']
subprocess.run(cmd,check=True)
subprocess.run([F,'-y','-loglevel','error','-i','ad60.wav','-b:a','192k','ad60.mp3'],check=True)
subprocess.run([F,'-i','ad60.wav'],capture_output=False,stderr=subprocess.STDOUT)
