"""Darzaan booking web application. Python 3.11+, FastAPI, SQLite."""
from __future__ import annotations
import os, re, csv, io, sqlite3, secrets, hmac, time, json
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo
from pathlib import Path
from contextlib import contextmanager
from urllib import request as urlrequest
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel, Field, field_validator

ROOT = Path(__file__).resolve().parent
DB = Path(os.getenv('DARZAAN_DB_PATH', str(ROOT / 'data' / 'darzaan.sqlite3')))
IST = ZoneInfo('Asia/Kolkata')
SLOTS = ['10:30 AM','11:30 AM','12:30 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM']
SERVICES = ['Designer Blouse','Bridal & Occasionwear','Saree Styling','Alterations & Fit','Custom Tailoring','Something Else']
MODES = ['In-studio consultation','Video consultation']
app = FastAPI(title='Darzaan', docs_url=None, redoc_url=None, openapi_url=None)
auth = HTTPBasic(auto_error=False)
RATE: dict[str, list[float]] = {}

@contextmanager
def connection():
    DB.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(str(DB), timeout=10, isolation_level=None)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA busy_timeout=10000')
    db.execute('PRAGMA foreign_keys=ON')
    try: yield db
    finally: db.close()

def setup():
    with connection() as db:
        db.execute('PRAGMA journal_mode=WAL')
        db.executescript('''
        CREATE TABLE IF NOT EXISTS appointments (
          id INTEGER PRIMARY KEY, reference TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
          phone TEXT NOT NULL, email TEXT, service TEXT NOT NULL, mode TEXT NOT NULL,
          appointment_date TEXT NOT NULL, appointment_time TEXT NOT NULL,
          notes TEXT, created_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'requested',
          whatsapp_status TEXT NOT NULL DEFAULT 'not_configured', consent INTEGER NOT NULL,
          CHECK(status IN ('requested','confirmed','cancelled','completed'))
        );
        CREATE UNIQUE INDEX IF NOT EXISTS one_active_booking_per_slot ON appointments(appointment_date, appointment_time, mode) WHERE status != 'cancelled';
        CREATE TABLE IF NOT EXISTS franchise_leads (
          id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL,
          profile TEXT NOT NULL, area TEXT NOT NULL, created_at TEXT NOT NULL, consent INTEGER NOT NULL
        );''')
setup()

@app.middleware('http')
async def security_headers(req: Request, call_next):
    res = await call_next(req)
    res.headers['X-Content-Type-Options'] = 'nosniff'
    res.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    res.headers['X-Frame-Options'] = 'DENY'
    res.headers['Permissions-Policy'] = 'geolocation=(), camera=(), microphone=()'
    res.headers['Content-Security-Policy'] = "default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
    if os.getenv('FORCE_HTTPS') == '1': res.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return res

def throttle(req: Request, limit=15):
    ip = req.client.host if req.client else 'unknown'
    now = time.monotonic()
    v = RATE.get(ip, [])
    v = [x for x in v if now-x < 60]
    if len(v) >= limit: raise HTTPException(429,'Too many requests; please try again shortly.')
    v.append(now); RATE[ip]=v

def name_ok(value, minlen=2, maxlen=80):
    v = value.strip()
    if not (minlen <= len(v) <= maxlen) or any(ord(c)<32 for c in v): raise ValueError('Invalid text')
    return v

class Appointment(BaseModel):
    name: str = Field(min_length=2,max_length=80)
    phone: str
    email: str = Field(default='',max_length=180)
    service: str
    mode: str
    date: str
    time: str
    notes: str = Field(default='',max_length=700)
    consent: bool
    website: str = '' # honeypot
    @field_validator('name')
    @classmethod
    def valid_name(cls,v): return name_ok(v)
    @field_validator('phone')
    @classmethod
    def valid_phone(cls,v):
        v=re.sub(r'[\s\-]','',v)
        if v.startswith('+91'): v=v[3:]
        if not re.fullmatch(r'[6-9]\d{9}',v): raise ValueError('Enter a valid Indian mobile number')
        return v
    @field_validator('email')
    @classmethod
    def valid_email(cls,v):
        v=v.strip()
        if v and not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',v): raise ValueError('Invalid email')
        return v

class Franchise(BaseModel):
    name: str = Field(min_length=2,max_length=80)
    phone: str
    type: str = Field(min_length=1,max_length=90)
    area: str = Field(min_length=2,max_length=120)
    consent: bool
    website: str = ''
    @field_validator('name','area')
    @classmethod
    def valid_text(cls,v): return name_ok(v,2,120)
    @field_validator('phone')
    @classmethod
    def valid_phone(cls,v): return Appointment.valid_phone(v)

def dates():
    now=datetime.now(IST).date()
    return [(now+timedelta(days=i)).isoformat() for i in range(1,15) if (now+timedelta(days=i)).weekday()!=6]

@app.get('/api/slots')
def slots(date: str, mode: str):
    if date not in dates() or mode not in MODES: raise HTTPException(422, 'Invalid appointment date or consultation mode')
    with connection() as db:
        occupied={r['appointment_time'] for r in db.execute('SELECT appointment_time FROM appointments WHERE appointment_date=? AND mode=? AND status != ?', (date,mode,'cancelled'))}
    return {'date':date,'mode':mode,'slots':[{'time':t,'available':t not in occupied} for t in SLOTS]}

def whatsapp_notify(a: Appointment, reference: str):
    token=os.getenv('WHATSAPP_TOKEN','').strip(); phone_id=os.getenv('WHATSAPP_PHONE_NUMBER_ID','').strip(); template=os.getenv('WHATSAPP_TEMPLATE_NAME','').strip()
    if not (token and phone_id and template): return 'not_configured'
    # Approved Meta Utility template with exactly 4 body variables: name, date, time, reference.
    payload={ 'messaging_product':'whatsapp','to':'91'+a.phone,'type':'template',
      'template':{'name':template,'language':{'code':os.getenv('WHATSAPP_TEMPLATE_LANGUAGE','en')},
      'components':[{'type':'body','parameters':[{'type':'text','text':x} for x in (a.name,a.date,a.time,reference)]}]}}
    req=urlrequest.Request('https://graph.facebook.com/v21.0/'+phone_id+'/messages',data=json.dumps(payload).encode(),headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'},method='POST')
    try:
        with urlrequest.urlopen(req,timeout=8) as r: return 'submitted' if r.status==200 else 'failed'
    except Exception: return 'failed'

@app.post('/api/appointments',status_code=201)
def create_appointment(a: Appointment, req: Request):
    throttle(req)
    if a.website: return {'ok':True,'message':'Request received'}
    if not a.consent: raise HTTPException(422,'Consent required')
    if a.service not in SERVICES or a.mode not in MODES or a.date not in dates() or a.time not in SLOTS: raise HTTPException(422,'Invalid service or appointment slot')
    ref = 'DZ-'+secrets.token_hex(4).upper()
    with connection() as db:
        try:
            db.execute('BEGIN IMMEDIATE')
            db.execute('INSERT INTO appointments(reference,name,phone,email,service,mode,appointment_date,appointment_time,notes,created_at,consent) VALUES(?,?,?,?,?,?,?,?,?,?,1)',(ref,a.name,a.phone,a.email,a.service,a.mode,a.date,a.time,a.notes.strip(),datetime.now(IST).isoformat()))
            db.commit()
        except sqlite3.IntegrityError:
            db.rollback(); raise HTTPException(409,'This slot was just requested by someone else. Please choose another.')
    status=whatsapp_notify(a,ref)
    with connection() as db: db.execute('UPDATE appointments SET whatsapp_status=? WHERE reference=?',(status,ref))
    return {'ok':True,'reference':ref,'status':'requested','whatsapp_status':status,'message':'Your request has been received. The Darzaan team will confirm your appointment.'}

@app.post('/api/franchise',status_code=201)
def franchise_lead(a: Franchise,req:Request):
    throttle(req)
    if a.website: return {'ok':True}
    if not a.consent: raise HTTPException(422,'Consent required')
    with connection() as db:
        db.execute('INSERT INTO franchise_leads(name,phone,profile,area,created_at,consent) VALUES(?,?,?,?,?,1)',(a.name,a.phone,a.type,a.area,datetime.now(IST).isoformat()))
    return {'ok':True,'message':'Thank you. Your enquiry has been received.'}

def require_admin(creds:HTTPBasicCredentials|None=Depends(auth)):
    username=os.getenv('ADMIN_USERNAME','');password=os.getenv('ADMIN_PASSWORD','')
    if not (username and password and creds and hmac.compare_digest(creds.username,username) and hmac.compare_digest(creds.password,password)):
        raise HTTPException(401,'Admin authentication required',headers={'WWW-Authenticate':'Basic realm="Darzaan Admin"'})

@app.get('/api/admin/export')
def export_csv(kind:str='appointments',_=Depends(require_admin)):
    if kind not in ('appointments','franchise'): raise HTTPException(422,'Invalid export type')
    with connection() as db:
        rows=[dict(x) for x in db.execute('SELECT * FROM '+('appointments' if kind=='appointments' else 'franchise_leads')+' ORDER BY id DESC')]
    buf=io.StringIO(); cols=list(rows[0].keys()) if rows else (['reference','name','phone','service','appointment_date','appointment_time','status'] if kind=='appointments' else ['name','phone','profile','area'])
    w=csv.DictWriter(buf,fieldnames=cols,extrasaction='ignore');w.writeheader()
    for row in rows:
        # prevent spreadsheet formula injection
        w.writerow({k:("'"+str(v) if isinstance(v,str) and v[:1] in ('=','+','-','@') else v) for k,v in row.items()})
    return StreamingResponse(iter([buf.getvalue()]),media_type='text/csv',headers={'Content-Disposition':f'attachment; filename="darzaan-{kind}.csv"','Cache-Control':'no-store'})

@app.get('/api/admin/appointments')
def admin_bookings(_=Depends(require_admin)):
    with connection() as db: rows=[dict(x) for x in db.execute('SELECT reference,name,phone,service,mode,appointment_date,appointment_time,status,whatsapp_status FROM appointments ORDER BY appointment_date, appointment_time')]
    return {'appointments':rows}

@app.patch('/api/admin/appointments/{reference}')
def update_booking(reference:str, status:str, _=Depends(require_admin)):
    if status not in ('requested','confirmed','cancelled','completed'):raise HTTPException(422,'Invalid status')
    with connection() as db:
        r=db.execute('UPDATE appointments SET status=? WHERE reference=?',(status,reference))
        if r.rowcount==0:raise HTTPException(404,'Not found')
    return {'ok':True}

@app.get('/api/health')
def health():return {'ok':True}
@app.get('/')
def home():return FileResponse(ROOT/'static'/'index.html',media_type='text/html')
@app.get('/robots.txt')
def robots():return FileResponse(ROOT/'static'/'robots.txt',media_type='text/plain')
@app.get('/sitemap.xml')
def sitemap():return FileResponse(ROOT/'static'/'sitemap.xml',media_type='application/xml')
@app.get('/assets/{name}')
def assets(name:str):
    if not re.fullmatch(r'[a-zA-Z0-9_\-.]+',name):raise HTTPException(404)
    path=ROOT/'static'/'assets'/name
    if not path.is_file():raise HTTPException(404)
    return FileResponse(path)
