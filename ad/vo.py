import json,urllib.request,subprocess,sys,os
SP="/tmp/claude-0/-home-user-Test/5e2d36ae-7d7c-540e-838d-dc0a84ec6d4c/scratchpad"
K=open(SP+"/.key").read(); F=open("/tmp/ffpath").read().strip()
VOICE=os.environ.get("VOICE","Kore")
L={
"s0":"יש לך מגרש, וחלום. ואלף שאלות. כמה זה יעלה? כמה זמן זה ייקח?",
"s1":"אז תכירו: טל גורן. אדריכלית.",
"s2":"הכול מתחיל בשיחה אחת. ללא עלות.",
"s3":"קודם בודקים את המגרש, לפני שמשרטטים קו אחד.",
"s4":"אחר כך מתכננים, מהצרכים שלכם, לבית על הנייר.",
"s5":"רישוי מלא, מול הוועדה והרשויות.",
"s6":"תוכניות עבודה מפורטות. כל פרט מתוכנן.",
"s7":"ובבנייה, טל איתכם, עד תעודת הגמר.",
"s8":"כמה זה יעלה? המחשבון באתר עונה מיד.",
"s9":"בתים פרטיים בשרון, במנשה ובחוף הכרמל. בתים שכבר עומדים.",
"s10":"ועד שהמפתח ביד.",
"s11":"לבנות בית, בלי לאבד שליטה. טל איתכם, בכל צעד.",
"s12":"טל גורן, אדריכלית. שיחת ייעוץ ראשונה, ללא עלות. התקשרו עכשיו.",
}
only=sys.argv[1:] or L.keys()
for k in only:
    body=json.dumps({"model":"google/gemini-3.8-flash-tts","input":L[k],"voice":VOICE,"response_format":"pcm"}).encode()
    req=urllib.request.Request("https://openrouter.ai/api/v1/audio/speech",body,{"Authorization":"Bearer "+K,"Content-Type":"application/json"})
    pcm=urllib.request.urlopen(req,timeout=120).read()
    open(f"vo/{k}.pcm","wb").write(pcm)
    subprocess.run([F,"-y","-loglevel","error","-f","s16le","-ar","24000","-ac","1","-i",f"vo/{k}.pcm",f"vo/{k}.wav"],check=True)
    # trim leading/trailing silence
    subprocess.run([F,"-y","-loglevel","error","-i",f"vo/{k}.wav","-af","silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse",f"vo/{k}_t.wav"],check=True)
    d=subprocess.run([F,"-i",f"vo/{k}_t.wav"],capture_output=True,text=True).stderr
    dur=[l for l in d.splitlines() if "Duration" in l][0].split()[1]
    print(k,dur,L[k])
