// Server-only configuration: never expose calendar URLs, event summaries or guest details.
const units=new Set(['studio2','studio21','apartment32','studio32','apartment42','room2']);
const dateValue=value=>{
 if(!/^\d{8}$/.test(value))throw new Error('Unsupported calendar date');
 const iso=value.slice(0,4)+'-'+value.slice(4,6)+'-'+value.slice(6,8),date=new Date(iso+'T00:00:00Z');
 if(!Number.isFinite(+date)||date.toISOString().slice(0,10)!==iso)throw new Error('Invalid calendar date');return iso;
};
export function parseAvailability(text){
 if(text.length>1000000||!text.includes('BEGIN:VCALENDAR')||!text.includes('END:VCALENDAR'))throw new Error('Invalid feed');
 const lines=text.replace(/\r\n[ \t]/g,'').replace(/\n[ \t]/g,'').split(/\r?\n/),events=[];let event=null;
 for(const line of lines){if(line==='BEGIN:VEVENT'){if(event)throw new Error('Nested event');event={};continue;}if(line==='END:VEVENT'){if(!event)throw new Error('Unmatched event');events.push(event);event=null;continue;}if(!event)continue;const split=line.indexOf(':');if(split<0)continue;const key=line.slice(0,split),value=line.slice(split+1),name=key.split(';')[0];if(['DTSTART','DTEND','RRULE','RDATE','EXDATE','RECURRENCE-ID','DURATION','STATUS','TRANSP'].includes(name)){if(event[name])throw new Error('Duplicate property');event[name]={key,value};}}
 if(event)throw new Error('Incomplete feed');const busy=[];
 for(const e of events){if(e.STATUS?.value==='CANCELLED'||e.TRANSP?.value==='TRANSPARENT')continue;if(['RRULE','RDATE','EXDATE','RECURRENCE-ID','DURATION'].some(k=>e[k]))throw new Error('Feed requires recurrence-aware adapter');
  if(!e.DTSTART||!e.DTEND||!/;VALUE=DATE(?:;|$)/.test(e.DTSTART.key)||!/;VALUE=DATE(?:;|$)/.test(e.DTEND.key))throw new Error('Feed requires date-time adapter');
  const start=dateValue(e.DTSTART.value),end=dateValue(e.DTEND.value);if(end<=start)throw new Error('Invalid interval');busy.push({start,end});
 }
 // iCalendar DTEND is exclusive. Merge only booking ranges; discard every other field.
 busy.sort((a,b)=>a.start.localeCompare(b.start));const merged=[];for(const range of busy){const last=merged.at(-1);if(last&&range.start<=last.end){if(range.end>last.end)last.end=range.end;}else merged.push({...range});}return merged;
}
export default async request=>{
 const headers={'Content-Type':'application/json; charset=utf-8','X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store'};
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(request.method!=='GET')return reply({status:'unavailable'},405);
 const unit=new URL(request.url).searchParams.get('unit');if(!units.has(unit))return reply({status:'unavailable'},400);
 const source=process.env['ZONA_ICAL_'+unit.toUpperCase()];if(!source)return reply({status:'unavailable'},503);
 try{const url=new URL(source);if(url.protocol!=='https:'||url.username||url.password||!url.hostname.includes('.')||/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname)||url.hostname.includes(':'))throw new Error('Invalid configured source');
  const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(8000),headers:{Accept:'text/calendar'}});if(!response.ok||Number(response.headers.get('content-length'))>1000000)throw new Error('Source unavailable');
  const reader=response.body.getReader();let bytes=0,text='';const decoder=new TextDecoder();while(true){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.length;if(bytes>1000000){await reader.cancel();throw new Error('Feed too large');}text+=decoder.decode(chunk.value,{stream:true});}text+=decoder.decode();
  let busy;try{busy=parseAvailability(text);}catch(error){console.warn('Calendar format not supported:',error.message);return reply({status:'unavailable',reason:'feed_format'},503);}headers['Cache-Control']='public, max-age=300';return reply({status:'ok',checkedAt:new Date().toISOString(),busy});
 }catch{return reply({status:'unavailable'},503);}
};
