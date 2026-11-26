"""Builds a blank trial copy from web/ into web-trial/: no personal details, its own storage, opens on the setup screen."""
import os,shutil,re
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=f'{ROOT}/web';OUT=f'{ROOT}/web-trial'
shutil.rmtree(OUT,ignore_errors=True);shutil.copytree(SRC,OUT)
p=f'{OUT}/index.html';s=open(p,encoding='utf8').read()
i=s.index('const SETUP={');j=s.index('};',i)+2
s=s[:i]+'''const SETUP={
  name:"",
  startDate:"",
  startWeight:null,
  goalWeight:null,
  about:"",
  injuries:"",
  foodNotes:""
};'''+s[j:]
n=s.count('"gym-plan-v1"');assert n>=3,n
s=s.replace('"gym-plan-v1"','("gym-trial-v1"+location.pathname.replace(/[^/]*$/,""))')
# only the version line itself, not the update check that reads it back (that made the trial always think an update was waiting)
s,nv=re.subn(r'const APP_VERSION="(?=\d)','const APP_VERSION="Trial · ',s,count=1);assert nv==1
assert s.count('var IS_TRIAL=false;')==1;s=s.replace('var IS_TRIAL=false;','var IS_TRIAL=true;')
assert s.count('/const APP_VERSION="([^"]+)"/')==2
assert 'Jonny' not in s.split('const SETUP={')[1].split('};')[0]
open(p,'w',encoding='utf8').write(s)
b=f'{OUT}/local-backend.js';t=open(b).read();assert t.count('"gym-plan-data"')==1;open(b,'w').write(t.replace('"gym-plan-data"','"gym-trial-data" + location.pathname.replace(/[^/]*$/, "")'))
pass
m=f'{OUT}/manifest.webmanifest';t=open(m).read();open(m,'w').write(t.replace('"My Gym Plan"','"Gym Plan"'))
print('trial built',sorted(os.listdir(OUT)))
