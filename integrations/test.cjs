const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const rows = [['Timestamp','Save the date!']];
let calendarCalls = 0;
let calendarCreates = 0;
let sharedEvent;
let failCalendar = false;
const sheet = {
 getLastRow:()=>rows.length, getLastColumn:()=>rows[0].length,
 getDataRange:()=>({getValues:()=>rows.map(row=>[...row])}),
 getRange(r,c,n=1,w=1) { return {
  getValues:()=>rows.slice(r-1,r-1+n).map(row=>row.slice(c-1,c-1+w)),
  setValues(values){values.forEach((row,i)=>{rows[r-1+i] ||= []; row.forEach((v,j)=>rows[r-1+i][c-1+j]=v);});},
  setValue(value){rows[r-1][c-1]=value;},
  createTextFinder(value){return {matchEntireCell(){return this;},matchCase(){return this;},findNext(){let i=rows.slice(r-1,r-1+n).findIndex(row=>String(row[c-1]).toLowerCase()===value.toLowerCase()); return i<0?null:{getRow:()=>r+i};}};}
 };}
};
const context = {
 console:{error(){},log(){}}, Date, String, Number, Error, Set,
 LockService:{getScriptLock:()=>({waitLock(){},hasLock:()=>true,releaseLock(){}})},
 SpreadsheetApp:{openById:id=>{assert.equal(id,'1xePq4sAfklgYcFMY2u2T6E5dza5oxioVeURAAWZMSyA');return {getSheetById:gid=>{assert.equal(gid,74886443);return sheet;}};},flush(){}},
 Calendar:{Events:{
  get(calendarId,id){assert.equal(calendarId,'primary');assert.equal(id,'benjrosette20261215');if(failCalendar)throw Error('Quota');if(!sharedEvent)throw Error('404 Not Found');return structuredClone(sharedEvent);},
  insert(event,calendarId,options){calendarCreates++;assert.equal(options.sendUpdates,'none');assert.equal(event.start.dateTime,'2026-12-15T14:00:00+08:00');assert.equal(event.end.dateTime,'2026-12-15T20:00:00+08:00');assert.match(event.description,/Wedding invitation and details: https:\/\/benj-rosette-wedding\.online\//);assert.equal(event.guestsCanSeeOtherGuests,false);assert.equal(event.conferenceData,null);sharedEvent={...structuredClone(event),attendees:[],status:'confirmed'};return structuredClone(sharedEvent);},
  patch(event,calendarId,id,options){calendarCalls++;assert.equal(id,'benjrosette20261215');assert.equal(options.sendUpdates,'all');assert.equal(options.conferenceDataVersion,1);assert.equal(event.guestsCanSeeOtherGuests,false);assert.equal(event.guestsCanInviteOthers,false);assert.equal(event.guestsCanModify,false);assert.equal(event.conferenceData,null);if(failCalendar)throw Error('Quota');sharedEvent={...sharedEvent,...structuredClone(event)};return structuredClone(sharedEvent);}
 }},
 HtmlService:{createHtmlOutput:html=>html}
};
vm.createContext(context); vm.runInContext(fs.readFileSync(__dirname+'/Code.gs','utf8'),context);
assert.equal(context.initializeWeddingCalendar(),'benjrosette20261215');
context.initializeWeddingCalendar();assert.equal(calendarCreates,1);
const input={name:'Test Guest',email:'test@example.com',attendance:'Joyfully accepts',guests:'2',requestId:'12345678-1234-1234-1234-123456789abc'};
assert.match(context.doPost({parameter:input}),/attendance is confirmed/);
assert.equal(rows.length,2);assert.equal(calendarCalls,1);
assert.match(context.doPost({parameter:input}),/already received/);assert.equal(calendarCalls,1);
assert.match(context.doPost({parameter:{...input,requestId:'22345678-1234-1234-1234-123456789abc'}}),/already received/);assert.equal(rows.length,2);
assert.match(context.doPost({parameter:{...input,email:'decline@example.com',attendance:'Regretfully declines',requestId:'32345678-1234-1234-1234-123456789abc'}}),/No calendar invitation/);assert.equal(calendarCalls,1);
assert.match(context.doPost({parameter:{...input,email:'invalid'}}),/could not be completed/);assert.equal(rows.length,3);
failCalendar=true;
assert.match(context.doPost({parameter:{...input,email:'failure@example.com',requestId:'42345678-1234-1234-1234-123456789abc'}}),/could not finish sending/);
assert.equal(rows[3][rows[0].indexOf('Calendar invitation')],'Needs follow-up');
const calendarBeforeNoEmail = calendarCalls;
const noEmail = {...input,email:'',guests:'4',message:'Accompanying guests:\nGuest 2: Test Companion A\nGuest 3: Test Companion B\nGuest 4: Test Companion C',requestId:'52345678-1234-1234-1234-123456789abc'};
assert.match(context.doPost({parameter:noEmail}),/attendance is confirmed/);
assert.equal(rows[4][rows[0].indexOf('Email address')],'');
assert.equal(rows[4][rows[0].indexOf('Number of guests')],4);
assert.match(rows[4][rows[0].indexOf('Message for the couple')],/Test Companion C/);
assert.equal(rows[4][rows[0].indexOf('Calendar invitation')],'No email provided');
assert.equal(calendarCalls,calendarBeforeNoEmail);
assert.match(context.doPost({parameter:noEmail}),/already received/);
assert.equal(rows.length,5);
assert.match(context.doPost({parameter:{...noEmail,name:'Another Guest',requestId:'62345678-1234-1234-1234-123456789abc'}}),/attendance is confirmed/);
assert.equal(rows.length,6);
assert.match(context.doPost({parameter:{...noEmail,attendance:'Regretfully declines',requestId:'72345678-1234-1234-1234-123456789abc'}}),/No calendar invitation/);
assert.equal(calendarCalls,calendarBeforeNoEmail);
assert.equal(context.safeCell_('=IMPORTXML("x")'),'\'=IMPORTXML("x")');
// Multiple RSVP emails share one event, preserving earlier guest responses.
sharedEvent.attendees[0].responseStatus='accepted';
const second={...input,email:'second@example.com',requestId:'82345678-1234-1234-1234-123456789abc'};
failCalendar=false;
assert.match(context.doPost({parameter:second}),/attendance is confirmed/);
assert.equal(calendarCreates,1);
assert.equal(sharedEvent.attendees.length,2);
assert.equal(sharedEvent.attendees[0].responseStatus,'accepted');
assert.equal(sharedEvent.attendees[1].additionalGuests,1);
assert.equal(rows.at(-1)[rows[0].indexOf('Calendar event ID')],'benjrosette20261215');
const callsBeforeDuplicate=calendarCalls;
context.inviteToSharedWedding_(second);assert.equal(calendarCalls,callsBeforeDuplicate);
// Backfill accepted historical RSVPs, excluding marked test names and declines.
const historical={...input,name:'Historical Guest',email:'history@example.com',requestId:'92345678-1234-1234-1234-123456789abc'};
failCalendar=true;context.doPost({parameter:historical});failCalendar=false;
rows.at(-1)[rows[0].indexOf('Calendar event ID')]='legacy-event@google.com';
const beforePreview=calendarCalls;context.previewExistingWeddingGuests();assert.equal(calendarCalls,beforePreview);
context.migrateExistingWeddingGuests();
assert(sharedEvent.attendees.some(guest=>guest.email==='history@example.com'));
assert(!sharedEvent.attendees.some(guest=>guest.email==='failure@example.com'));
assert(!sharedEvent.attendees.some(guest=>guest.email==='decline@example.com'));
assert.equal(rows.at(-1)[rows[0].indexOf('Previous calendar event ID')],'legacy-event@google.com');
const afterMigration=calendarCalls;context.migrateExistingWeddingGuests();assert.equal(calendarCalls,afterMigration);
assert.equal(calendarCreates,1);
// A cancelled shared event fails safely instead of creating another event.
sharedEvent.status='cancelled';
assert.throws(()=>context.initializeWeddingCalendar(),/cancelled/);
assert.match(context.doPost({parameter:{...input,email:'cancelled@example.com',requestId:'a2345678-1234-1234-1234-123456789abc'}}),/could not finish sending/);
assert.equal(calendarCreates,1);
console.log('Passed: acceptance, declines, duplicate protection, validation, timezone, formula escaping, calendar failure receipt, shared event reuse, guest privacy, retained responses, migration, and cancelled event safety.');
