"use client";

import { useMemo, useState } from "react";
import type { ResponseRow } from "@/lib/godparents";
import type { RsvpRow } from "@/lib/rsvp";
import { formatManila } from "@/lib/time";
import { Icon } from "@/components/ornaments";
import { deleteResponseAction, deleteRsvpAction } from "./actions";

const SAMPLE_GUESTS: RsvpRow[] = [
  { id:"sample-maria",guestName:"Maria Santos",attending:true,createdAt:"2026-10-30T05:10:00Z",duplicate:false },
  { id:"sample-miguel",guestName:"Miguel Reyes",attending:true,createdAt:"2026-10-30T04:30:00Z",duplicate:false },
  { id:"sample-ana",guestName:"Ana Cruz",attending:false,createdAt:"2026-10-29T10:00:00Z",duplicate:false },
  { id:"sample-paolo",guestName:"Paolo Garcia",attending:true,createdAt:"2026-10-29T08:20:00Z",duplicate:false },
];
const SAMPLE_GODPARENTS: ResponseRow[] = [
  { id:"sample-lucia",name:"Lucia Santos",role:"ninang",accepted:true,personal:false,updatedAt:"2026-10-30T05:00:00Z" },
  { id:"sample-antonio",name:"Antonio Reyes",role:"ninong",accepted:false,personal:false,updatedAt:"2026-10-29T07:30:00Z" },
];
type AttendanceFilter = "all" | "attending" | "declined";

export function Dashboard({ rsvps, responses }: { rsvps:RsvpRow[];responses:ResponseRow[] }) {
  const [sample,setSample]=useState(rsvps.length===0 && responses.length===0);
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState<AttendanceFilter>("all");
  const guests=sample?SAMPLE_GUESTS:rsvps;
  const godparents=sample?SAMPLE_GODPARENTS:responses;
  const attending=guests.filter(g=>g.attending).length;
  const filtered=useMemo(()=>guests.filter(g=>g.guestName.toLowerCase().includes(query.trim().toLowerCase()) && (filter==="all" || g.attending===(filter==="attending"))),[guests,query,filter]);
  return <div className="admin-dashboard">
    <div className={`admin-preview ${sample?"is-sample":""}`}>
      <div><span className="admin-preview-title">{sample?"Sample preview":"Your actual RSVPs"}</span><p>{sample?"These example names show how your guest list will look.":"Only guests who have submitted an RSVP appear here."}</p></div>
      <button type="button" onClick={()=>{setSample(!sample);setQuery("");setFilter("all");}}>{sample?"Show actual RSVPs":"See sample guests"}</button>
    </div>
    <dl className="admin-stats">
      {[{label:"Total RSVPs",value:guests.length,icon:"envelope" as const,tone:"total"},{label:"Attending",value:attending,icon:"check" as const,tone:"yes"},{label:"Declined",value:guests.length-attending,icon:"close" as const,tone:"no"}].map(item=><div className={`admin-stat stat-${item.tone}`} key={item.label}><span className="admin-stat-icon"><Icon name={item.icon} size={18} /></span><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
    </dl>
    <section className="admin-panel" aria-labelledby="rsvp-title">
      <div className="admin-panel-heading"><div><p className="admin-eyebrow">The celebration</p><h2 id="rsvp-title">Guest attendance</h2></div><span className="admin-count">{guests.length} guests</span></div>
      <div className="admin-search"><label htmlFor="search">Find a guest</label><div><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg><input id="search" type="search" className="field" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search a name" /></div></div>
      <div className="admin-filters" role="group" aria-label="Filter guest attendance">{([ ["all","All guests"],["attending","Attending"],["declined","Declined"] ] as const).map(([value,label])=><button key={value} type="button" aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}</button>)}</div>
      <p className="admin-result-count" aria-live="polite">{filtered.length} {filtered.length===1?"guest":"guests"}{query?` matching “${query}”`:" shown"}</p>
      <ul className="admin-guest-list">{filtered.map(g=><li key={g.id} className="admin-guest"><span className="admin-avatar" aria-hidden="true">{g.guestName.charAt(0)}</span><div className="admin-guest-info"><p>{g.guestName}</p><time dateTime={g.createdAt}>{formatManila(g.createdAt)}</time>{g.duplicate&&<small className="admin-duplicate">Another RSVP uses this name</small>}</div><span className={`admin-status ${g.attending?"status-yes":"status-no"}`}>{g.attending?"Attending":"Declined"}</span>{!sample&&<ConfirmDelete action={deleteRsvpAction} id={g.id} what={`RSVP from ${g.guestName}`} />}</li>)}</ul>
      {filtered.length===0&&<div className="admin-empty"><Icon name="envelope" size={30} /><h3>{query||filter!=="all"?"No matching guests":"No RSVPs yet"}</h3><p>{query||filter!=="all"?"Try another name or choose All guests.":"Guests will appear here when they choose attending or declined."}</p></div>}
    </section>
    <section className="admin-panel" aria-labelledby="gp-title"><div className="admin-panel-heading"><div><p className="admin-eyebrow">A special place in her life</p><h2 id="gp-title">Godparents</h2></div><span className="admin-count">{godparents.filter(g=>g.accepted).length} accepted</span></div>
      <p className="admin-panel-note">See who has accepted Isabelle&rsquo;s invitation to be a godparent.</p>
      <ul className="admin-guest-list">{godparents.map(g=><li key={g.id} className="admin-guest"><span className="admin-avatar" aria-hidden="true">{g.name.charAt(0)}</span><div className="admin-guest-info"><p>{g.name}</p><span className="admin-role">{g.role??"Godparent"}</span></div><span className={`admin-status ${g.accepted?"status-yes":"status-no"}`}>{g.accepted?"Accepted":"Declined"}</span>{!sample&&<ConfirmDelete action={deleteResponseAction} id={g.id} what={`answer from ${g.name}`} />}</li>)}</ul>
      {godparents.length===0&&<div className="admin-empty"><Icon name="heart" size={30} /><h3>No godparent answers yet</h3><p>Accepted and declined invitations will appear here.</p></div>}
    </section>
  </div>;
}

function ConfirmDelete({action,id,what}:{action:(data:FormData)=>Promise<void>;id:string;what:string}) {
  const [confirming,setConfirming]=useState(false);
  if(!confirming)return <button className="admin-remove" type="button" aria-label={`Remove ${what}`} onClick={()=>setConfirming(true)}>Remove</button>;
  return <form action={action} className="admin-remove-confirm"><input type="hidden" name="id" value={id} /><button type="submit" aria-label={`Confirm removing ${what}`}>Remove</button><button type="button" onClick={()=>setConfirming(false)}>Cancel</button></form>;
}
