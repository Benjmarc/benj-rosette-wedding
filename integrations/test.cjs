const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const rows = [['Timestamp','Save the date!']];
let calendarCalls = 0;
let failCalendar = false;
const sheet = {
 getLastRow:()=>rows.length, getLastColumn:()=>rows[0].length,
 getRange(r,c,n=1,w=1) { return {
  getValues:()=>rows.slice(r-1,r-1+n).map(row=>row.slice(c-1,c-1+w)),
  setValues(values){values.forEach((row,i)=>{rows[r-1+i] ||= []; row.forEach((v,j)=>rows[r-1+i][c-1+j]=v);});},
  setValue(value){rows[r-1][c-1]=value;},
  createTextFinder(value){return {matchEntireCell(){return this;},matchCase(){return this;},findNext(){let i=rows.slice(r-1,r-1+n).findIndex(row=>String(row[c-1]).toLowerCase()===value.toLowerCase()); return i<0?null:{getRow:()=>r+i};}};}
 };}
};
const context = {
 console:{error(){}}, Date, String, Number, Error,
 LockService:{getScriptLock:()=>({waitLock(){},hasLock:()=>true,releaseLock(){}})},
 SpreadsheetApp:{openById:id=>{assert.equal(id,'1xePq4sAfklgYcFMY2u2T6E5dza5oxioVeURAAWZMSyA');return {getSheetById:gid=>{assert.equal(gid,74886443);return sheet;}};},flush(){}},
 CalendarApp:{getDefaultCalendar:()=>({createEvent(title,start,end,options){calendarCalls++;assert.equal(start.toISOString(),'2026-12-15T06:00:00.000Z');assert.equal(options.sendInvites,true);assert.match(options.description,/Wedding invitation and details: https:\/\/benj-rosette-wedding\.online\//);if(failCalendar)throw Error('Quota');return {setGuestsCanSeeGuests(){},setGuestsCanInviteOthers(){},getId:()=>`event-${calendarCalls}`};}})},
 HtmlService:{createHtmlOutput:html=>html}
};
vm.createContext(context); vm.runInContext(fs.readFileSync(__dirname+'/Code.gs','utf8'),context);
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
console.log('Passed: acceptance, declines, duplicate protection, validation, timezone, formula escaping, and calendar failure receipt.');
