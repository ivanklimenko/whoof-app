import QRCode from 'qrcode';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, QrCode, ShareNetwork, LinkSimple, FirstAidKit, FileText, ImageSquare, FolderSimplePlus, DownloadSimple, Trash, LockSimple, CalendarBlank, CaretLeft, Spinner, House, ChartBar, PawPrint, Globe, Info, ShieldCheck, Question, ChatCircle, CircleNotch, CaretDown, CaretRight, ArrowLeft, ArrowUp, Plus, Minus, MapPin, NavigationArrow, Play, Pause, Stop, Check, X, Clock, Path, Users, GearSix, Bell, Bluetooth, Heart, Moon, Thermometer, Lightning, PencilSimple, Sparkle } from '@phosphor-icons/react';
import { MobileScroll, BottomSheet, KeyboardInput, KeyboardTextarea, useKeyboard, useKeyboardInsets } from './native';
import './prototype.css';

type Page = 'home' | 'metrics' | 'walks' | 'settings' | 'profile' | 'access' | 'invite' | 'ai';
type Walk = { id: number; title: string; date: string; duration: string; distance: string; friends: string };
const settingsGroups=[
 [{id:'security',label:'Настройки безопасности',Icon:LockSimple},{id:'notification-settings',label:'Уведомления',Icon:Bell},{id:'language',label:'Язык',Icon:Globe}],
 [{id:'about',label:'О нас',Icon:Info},{id:'privacy',label:'Политика приватности',Icon:ShieldCheck},{id:'terms',label:'Правила пользования',Icon:FileText}],
 [{id:'faq',label:'FAQ',Icon:Question},{id:'support',label:'Поддержка',Icon:ChatCircle}],
];
const settingsTitles:Record<string,string>={security:'Настройки безопасности','notification-settings':'Уведомления',language:'Язык',about:'О нас',privacy:'Политика приватности',terms:'Правила пользования',faq:'FAQ',support:'Поддержка',collar:'Настройки устройства'};
const DOG = '/assets/whoof/dog-color.png', MAP = '/assets/whoof/park-map.png';
// Small category icons use the same surface and color tokens throughout the app.
function AccentIcon({icon:Icon,tone='blue'}:{icon:typeof Lightning;tone?:string}){
 return <span className={`accent-icon tone-${tone}`} aria-hidden="true"><Icon size={19} weight="fill"/></span>;
}
const chartPalette={
 blue:['#91b2f8','#5d89e8'],
 purple:['#bea0f1','#946bd7'],
 coral:['#f4a6ae','#df7988'],
 cyan:['#90d9e7','#55b5cb'],
 orange:['#f6be98','#e99968'],
} as const;
type ChartTone=keyof typeof chartPalette;
const metricTones:ChartTone[]=['blue','purple','coral','cyan','orange'];
const settingTones:Record<string,string>={security:'purple','notification-settings':'coral',language:'blue',about:'cyan',privacy:'green',terms:'orange',faq:'purple',support:'pink'};
const dogs = [{name:'Боня',breed:'Корги · 2 года',owner:'Анна',distance:'150 м',x:35,y:34},{name:'Ричи',breed:'Бигль · 4 года',owner:'Михаил',distance:'320 м',x:72,y:53},{name:'Луна',breed:'Лабрадор · 3 года',owner:'Мария',distance:'480 м',x:46,y:76}];
const metrics = [{name:'Активность',value:'2 ч 15 мин',unit:'',note:'На 12% больше, чем вчера',icon:Lightning,values:[20,28,23,40,35,47,42]},{name:'Сон',value:'8 ч 40 мин',unit:'',note:'Ночной сон без долгих пробуждений',icon:Moon,values:[36,40,37,42,39,46,44]},{name:'Пульс в покое',value:'72',unit:'уд/мин',note:'Среднее значение за сегодня',icon:Heart,values:[38,42,34,37,32,36,34]},{name:'Частота дыхания',value:'22',unit:'вдоха/мин',note:'Измерено во время отдыха',icon:CircleNotch,values:[22,26,20,24,22,20,22]},{name:'Температура кожи',value:'37,8',unit:'°C',note:'Температура в области ошейника',icon:Thermometer,values:[36,38,35,37,38,36,38]}];
type MetricPeriod = 'День' | 'Неделя' | 'Месяц';
const metricPeriods:MetricPeriod[]=['День','Неделя','Месяц'];
const periodReadings:Record<MetricPeriod,string[]>={
 'День':['2 ч 15 мин','8 ч 40 мин','72','22','37,8'],
 'Неделя':['2 ч 08 мин','8 ч 26 мин','70','21','37,6'],
 'Месяц':['2 ч 04 мин','8 ч 32 мин','71','22','37,7'],
};
function metricsForPeriod(period:MetricPeriod){
 return metrics.map((metric,index)=>({...metric,value:periodReadings[period][index],
  note:period==='День'?['На 12% больше, чем вчера','Спокойный ночной сон','В среднем за сегодня','Во время отдыха','В области ошейника'][index]:index<2?'В среднем за день':`В среднем за ${period==='Неделя'?'неделю':'месяц'}`,
  values:period==='Неделя'?metric.values:period==='День'?metric.values.map((v,i)=>v*(.6+i*.05)):Array.from({length:30},(_,i)=>metric.values[i%7]*(.7+(i%3)*.1)),
 }));
}
function metricDateRange(period:MetricPeriod){
 const today=dateKey(new Date());
 return period==='День'?`Сегодня, ${dateLabel(today)}`:`${dateLabel(moveDate(today,period==='Неделя'?-6:-29))} — ${dateLabel(today)}`;
}
function metricAxisLabels(period:MetricPeriod){
 if(period==='День')return [];
 const count=period==='Неделя'?7:30,today=dateKey(new Date());
 return Array.from({length:count},(_,index)=>{
  const date=fromKey(moveDate(today,index-count+1));
  return period==='Неделя'?date.toLocaleDateString('ru-RU',{weekday:'short'}):String(date.getDate());
 });
}
function MetricNumber({value}:{value:string}){
 if(!value.includes(' ч'))return <strong>{value}</strong>;
 return <strong className="metric-duration">{Array.from(value.matchAll(/(\d+)\s*(ч|мин)/g),match=><span key={match[2]}>{Number(match[1])}<small> {match[2]}</small></span>)}</strong>;
}
const activity=[0,0,0,0,0,0,0,0,0,0,1,2,3,5,10,16,20,21,40,48,28,30,14,7,7,8,12,20,20,28,40,50,36,25,15,8,6];
function ActivityChart({values,compact=false,tone='blue',label,axisLabels}:{values?:number[];compact?:boolean;tone?:ChartTone;label?:string;axisLabels?:string[]}){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const el=canvas.current;if(!el)return;const draw=()=>{const w=el.clientWidth,h=el.clientHeight,dpr=window.devicePixelRatio||1;el.width=w*dpr;el.height=h*dpr;const c=el.getContext('2d');if(!c)return;c.scale(dpr,dpr);c.clearRect(0,0,w,h);const left=compact?8:22,top=compact?12:26,bottom=compact?18:axisLabels?.length?36:27,right=8,pw=w-left-right,ph=h-top-bottom;c.font='11px -apple-system, BlinkMacSystemFont, sans-serif';c.fillStyle='#7c838c';c.strokeStyle='#eaeaea';c.lineWidth=.65;for(let i=0;i<4;i++){const y=top+ph*i/3;c.beginPath();c.moveTo(left,y);c.lineTo(w-right,y);c.stroke();if(!compact&&!values)c.fillText(String(60-i*20),0,y+4);}const data=values||activity,total=values?values.length:61;if(!compact&&!values){[0,6,12,18,24].forEach((t,i)=>{const x=left+pw*i/4;c.beginPath();c.moveTo(x,top);c.lineTo(x,top+ph);c.stroke();c.textAlign='center';c.fillText(String(t).padStart(2,'0'),x,h-7);});c.textAlign='left';}const bw=values?pw/total*.56:pw/total*.64;const colors=chartPalette[tone];data.forEach((v,i)=>{const x=left+i*pw/total+(pw/total-bw)/2,bh=v/60*ph;const fill=c.createLinearGradient(0,top+ph-Math.max(bh,1),0,top+ph);fill.addColorStop(0,colors[0]);fill.addColorStop(1,colors[1]);c.fillStyle=fill;c.beginPath();c.roundRect(x,top+ph-bh,bw,Math.max(bh,0),[3,3,0,0]);c.fill();});
 if(!compact&&axisLabels?.length){
  c.font='10px -apple-system, BlinkMacSystemFont, sans-serif';c.fillStyle='#767676';c.textAlign='center';
  axisLabels.forEach((text,index)=>{
   // Weekly labels fit every bar; monthly ticks stay legible at phone width.
   if(axisLabels.length>7&&index%5!==0&&index!==axisLabels.length-1)return;
   c.fillText(text,left+(index+.5)*pw/total,h-10);
  });
  c.textAlign='left';
 }
 if(!values&&!compact){const x=left+pw*14.5/24;c.setLineDash([4,3]);c.strokeStyle='#858b94';c.beginPath();c.moveTo(x,top-10);c.lineTo(x,top+ph);c.stroke();c.setLineDash([]);c.fillStyle='#858b94';c.beginPath();c.arc(x,top-10,3,0,Math.PI*2);c.fill();c.textAlign='center';c.fillText('14:30',x,top-18);}};draw();const observer=new ResizeObserver(draw);observer.observe(el);return()=>observer.disconnect();},[values,compact,tone,axisLabels]);
 return <canvas ref={canvas} className={compact?'mini-chart':'activity-chart'} role="img" aria-label={label||(compact?'Динамика показателя за неделю':'Активность сегодня: пики утром и днём, данные до 14:30')}/>;
}
const levelNames=['Покой','Низкая','Средняя','Высокая','Очень высокая'];
const dateKey=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fromKey=(key:string)=>new Date(`${key}T12:00:00`);
const moveDate=(key:string,days:number)=>{const d=fromKey(key);d.setDate(d.getDate()+days);return dateKey(d);};
const dateLabel=(key:string)=>fromKey(key).toLocaleDateString('ru-RU',{day:'numeric',month:'long'});
const timeLabel=(minute:number)=>`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;
const durationLabel=(minutes:number)=>minutes<60?`${minutes} мин`:`${Math.floor(minutes/60)} ч${minutes%60?` ${minutes%60} мин`:''}`;
function makeDayData(key:string,today:string){
 const seed=fromKey(key).getDate(),isToday=key===today,end=isToday?870:1440;
 const levels=Array.from({length:end/15},()=>0);
 const place=(start:number,pattern:number[])=>pattern.forEach((value,i)=>{if(start+i<levels.length)levels[start+i]=value;});
 place(28+(isToday?0:seed%3),[1,2,4,3]);
 place(46+(isToday?0:seed%2),[1,2,4,3,1]);
 if(!isToday){place(68+seed%3,[1,2,3,4,2,1]);if(seed%2)place(82,[1,2]);}
 const totals=levelNames.map((_,level)=>levels.filter(v=>v===level).length*15);
 const sleep=Math.min(totals[0],isToday?520:480+seed%5*15);
 return {levels,totals,end,sleep,active:totals.slice(1).reduce((a,b)=>a+b,0)};
}
type DayInsight={id:string;index:number;title:string;description:string;evidence:string;kind:'social'|'play'};
function makeDayInsights(day:string,today:string):DayInsight[]{
 const isToday=day===today,seed=fromKey(day).getDate();
 return [
  {id:`${day}-social`,index:30+(isToday?0:seed%3),kind:'social',title:'Возможно, встретил друга',description:'На прогулке Джека стал заметно активнее. Возможно, он встретил другую собаку и включился в совместную игру.',evidence:'На графике — переход от низкой активности к очень высокой за несколько отрезков.'},
  {id:`${day}-play`,index:49+(isToday?0:seed%2),kind:'play',title:'Похоже, увлёкся игрой',description:'Джека мог увлечённо играть, а затем переключиться на отдых. Такой момент бывает и дома, и на прогулке.',evidence:'После всплеска активность постепенно снижается: от высокой к низкой, затем к покою.'}
 ];
}
// Periods follow uninterrupted movement or rest, independently of sampling bins.
function activityPeriod(levels:number[],minute:number){
 const index=Math.min(levels.length-1,Math.floor(minute/15));
 const moving=levels[index]>0;
 let start=index,end=index+1;
 while(start>0&&(levels[start-1]>0)===moving)start--;
 while(end<levels.length&&(levels[end]>0)===moving)end++;
 return {start:start*15,end:end*15,level:levels[index]};
}
function DayTimeline({levels,selected,insights,onInsight}:{levels:number[];selected:number;insights:DayInsight[];onInsight:(insight:DayInsight)=>void}){
 const ref=useRef<HTMLCanvasElement>(null);
 const selectedIndex=Math.min(levels.length-1,Math.floor(selected/15));
 useEffect(()=>{const el=ref.current;if(!el)return;const draw=()=>{
  const w=el.clientWidth,h=el.clientHeight,dpr=window.devicePixelRatio||1;el.width=w*dpr;el.height=h*dpr;
  const c=el.getContext('2d');if(!c)return;c.scale(dpr,dpr);
  const left=12,top=24,bottom=4,pw=w-24,ph=h-top-bottom,step=pw/96;
  c.lineWidth=.7;c.strokeStyle='#f0f0f0';c.setLineDash([]);
  for(let level=1;level<=4;level++){const y=top+ph*(1-level/4);c.beginPath();c.moveTo(left,y);c.lineTo(w-left,y);c.stroke();}
  c.setLineDash([]);
  levels.forEach((level,i)=>{const height=level?ph*level/4:2.5,bw=Math.max(1.5,step*.65);const fill=c.createLinearGradient(0,top+ph-height,0,top+ph);fill.addColorStop(0,chartPalette.blue[0]);fill.addColorStop(1,chartPalette.blue[1]);c.fillStyle=selectedIndex===i?'#3c68c7':level===0?'#e0e8f8':fill;c.beginPath();c.roundRect(left+i*step+(step-bw)/2,top+ph-height,bw,height,[2,2,0,0]);c.fill();});
  const x=left+pw*selected/1440;c.strokeStyle='#698bd3';c.lineWidth=1;c.beginPath();c.moveTo(x,top-12);c.lineTo(x,h);c.stroke();
 };draw();const observer=new ResizeObserver(draw);observer.observe(el);return()=>observer.disconnect();},[levels,selected,selectedIndex]);
 return <div className="day-chart-wrap"><canvas ref={ref} className="day-timeline" role="img" aria-label={`Активность за день. Выбрано ${timeLabel(selected)}: ${levelNames[levels[selectedIndex]]}`}/><div className="insight-marker-layer">{insights.filter(insight=>insight.index<levels.length).map(insight=><button key={insight.id} className={`insight-marker ${selectedIndex===insight.index?'is-selected':''}`} style={{left:`${(insight.index+.5)/96*100}%`,top:`${(1-levels[insight.index]/4)*100}%`}} aria-label={`Инсайт в ${timeLabel(insight.index*15)}: ${insight.title}`} aria-haspopup="dialog" onClick={()=>onInsight(insight)}><span><Sparkle size={12} weight="fill"/></span></button>)}</div></div>;
}
function DaySlider({selected,end,onSelect}:{selected:number;end:number;onSelect:(minute:number)=>void}){
 const fraction=selected/1440,available=end/1440;
 return <div className="day-slider">
  <div className="day-slider-control">
   <div className="day-slider-track" aria-hidden="true"><span style={{width:`${fraction*100}%`}}/></div>
   <output className="day-slider-time" htmlFor="day-time" style={{left:`calc(${fraction*100}% + ${12-fraction*24}px)`}}>{timeLabel(selected)}</output>
   <input id="day-time" type="range" min={0} max={end} step={1} value={selected} style={{width:`calc(${available*100}% + ${24-available*24}px)`}} data-scroll-drag="ignore" aria-label="Выбрать время дня" aria-valuetext={timeLabel(selected)} onChange={e=>onSelect(Number(e.target.value))}/>
  </div>
  <div className="day-slider-hours" aria-hidden="true">{[0,6,12,18,24].map(hour=><span key={hour}>{timeLabel(hour*60)}</span>)}</div>
  <p className="day-slider-hint">Двигайте ползунок, чтобы выбрать время</p>
 </div>;
}
function HomeActivity(){
 const [today]=useState(()=>dateKey(new Date())),[day,setDay]=useState(today),[selected,setSelected]=useState(870);
 const [modal,setModal]=useState<'calendar'|'movement'|'rest'|'insight'|null>(null),[month,setMonth]=useState(()=>{const d=fromKey(today);d.setDate(1);return dateKey(d);});
 const [activeInsight,setActiveInsight]=useState<DayInsight|null>(null);
 const earliest=moveDate(today,-29),data=useMemo(()=>makeDayData(day,today),[day,today]);
 const insights=useMemo(()=>makeDayInsights(day,today),[day,today]);
 const openInsight=(insight:DayInsight)=>{setSelected(insight.index*15+7);setActiveInsight(insight);setModal('insight');};
 const chooseDay=(key:string)=>{if(key<earliest||key>today)return;setDay(key);setSelected(makeDayData(key,today).end);setActiveInsight(null);setModal(null);};
 const shiftMonth=(delta:number)=>{const d=fromKey(month);d.setMonth(d.getMonth()+delta);setMonth(dateKey(d));};
 const monthDate=fromKey(month),offset=(monthDate.getDay()+6)%7,monthLength=new Date(monthDate.getFullYear(),monthDate.getMonth()+1,0).getDate();
 const cells=Array.from({length:Math.ceil((offset+monthLength)/7)*7},(_,i)=>{const n=i-offset+1;return n>0&&n<=monthLength?n:null;});
 const period=activityPeriod(data.levels,selected);
 const selectedInsight=insights.find(insight=>insight.index*15>=period.start&&insight.index*15<period.end);
 return <section className="activity-section activity-explorer">
  <div className="date-navigation"><h2 className="day-map-title">Карта дня</h2><button className="date-trigger" aria-label="Выбрать дату" onClick={()=>{const d=fromKey(day);d.setDate(1);setMonth(dateKey(d));setModal('calendar');}}><span>{dateLabel(day)}</span><CaretDown size={15}/></button></div>
  <DayTimeline levels={data.levels} selected={selected} insights={insights} onInsight={openInsight}/>
  <DaySlider selected={selected} end={data.end} onSelect={setSelected}/>
  <section className="moment-details" aria-label="Показатели выбранного момента" data-testid="interval-details">
   <p className="moment-caption">В выбранный момент</p>
   <dl className="moment-values">
    <div><dt>Интенсивность</dt><dd>{levelNames[period.level]}</dd></div>
    <div><dt>Период</dt><dd>{timeLabel(period.start)}–{timeLabel(period.end)}</dd></div>
    <div><dt>Длительность</dt><dd>{durationLabel(period.end-period.start)}</dd></div>
   </dl>
   {selectedInsight&&<button className="moment-insight" aria-haspopup="dialog" onClick={()=>openInsight(selectedInsight)}><Sparkle size={20} weight="fill"/><span>Инсайт</span><CaretRight size={18}/></button>}
  </section>
  <section className="day-summary" aria-labelledby="day-summary-title"><div className="day-summary-label"><h2 id="day-summary-title">Итоги дня</h2><span>{day===today?'до 14:30':'за 24 часа'}</span></div>
  <div className="day-cards"><button className="day-card" aria-label="В движении: разбивка по интенсивности" onClick={()=>setModal('movement')}><span className="day-card-top"><AccentIcon icon={Lightning}/><CaretRight size={14}/></span><span className="day-card-title">В движении</span><div className="day-total"><MetricNumber value={durationLabel(data.active)}/></div><div className="intensity-bar" aria-hidden="true">{data.totals.slice(1).map((minutes,i)=><span key={i} style={{flex:minutes,background:['#d9e6ff','#a6c3ff','#6e9dff','#3972ed'][i]}}/>)}</div><p><b>{durationLabel(data.totals[4])}</b> — очень высокая активность</p></button><button className="day-card" aria-label="В покое: сон и отдых" onClick={()=>setModal('rest')}><span className="day-card-top"><AccentIcon icon={Moon} tone="purple"/><CaretRight size={14}/></span><span className="day-card-title">В покое</span><div className="day-total"><MetricNumber value={durationLabel(data.totals[0])}/></div><div className="intensity-bar" aria-hidden="true"><span style={{flex:data.sleep,background:'#a58aef'}}/><span style={{flex:data.totals[0]-data.sleep,background:'#eee8fb'}}/></div><p><b>{durationLabel(data.sleep)}</b> — сон<br/>Остальное — отдых</p></button></div>
  </section>
  <BottomSheet open={modal!==null} onOpenChange={open=>{if(!open)setModal(null);}} title={modal==='insight'?'Инсайт':modal==='calendar'?'Выберите день':modal==='movement'?'В движении':'Сон и отдых'} description="" snap={.76}><div className="sheet-body"><button className="sheet-close icon-button" aria-label="Закрыть окно активности" onClick={()=>setModal(null)}><X size={19}/></button>
  {modal==='insight'&&activeInsight?<div className="day-insight-detail"><div className="insight-context"><span className="insight-kind-icon">{activeInsight.kind==='social'?<PawPrint size={27}/>:<Lightning size={27}/>}</span><span>{dateLabel(day)}<br/><strong>{timeLabel(activeInsight.index*15+7)}</strong></span></div><h2>{activeInsight.title}</h2><p className="insight-description">{activeInsight.description}</p><section className="insight-evidence"><h3>Что заметил трекер</h3><p>{activeInsight.evidence}</p></section><p className="insight-disclaimer">Это возможное объяснение: по метрикам нельзя точно определить причину всплеска активности.</p><button className="primary full" onClick={()=>setModal(null)}>Посмотреть этот момент<CaretRight size={17}/></button></div>:modal==='calendar'?<div className="calendar"><div className="calendar-month"><button className="icon-button" aria-label="Предыдущий месяц" disabled={month.slice(0,7)<=earliest.slice(0,7)} onClick={()=>shiftMonth(-1)}><CaretLeft size={19}/></button><strong>{monthDate.toLocaleDateString('ru-RU',{month:'long',year:'numeric'}).replace(' г.','')}</strong><button className="icon-button" aria-label="Следующий месяц" disabled={month.slice(0,7)>=today.slice(0,7)} onClick={()=>shiftMonth(1)}><CaretRight size={19}/></button></div><table><thead><tr>{['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d=><th key={d}>{d}</th>)}</tr></thead><tbody>{Array.from({length:cells.length/7},(_,row)=><tr key={row}>{cells.slice(row*7,row*7+7).map((n,i)=>{if(n===null)return <td key={i}/>;const key=`${month.slice(0,7)}-${String(n).padStart(2,'0')}`;return <td key={i}><button className={`${key===day?'chosen':''} ${key===today?'is-today':''}`} aria-pressed={key===day} aria-label={fromKey(key).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})} disabled={key>today||key<earliest} onClick={()=>chooseDay(key)}>{n}</button></td>;})}</tr>)}</tbody></table><button className="secondary full" onClick={()=>chooseDay(today)}>Сегодня, {dateLabel(today)}</button><p className="footnote">Доступны последние 30 дней.</p></div>:<><p className="breakdown-date">{dateLabel(day)} · {day===today?'до 14:30':'полный день'}</p><strong className="breakdown-total">{durationLabel(modal==='movement'?data.active:data.totals[0])}</strong>{(modal==='movement'?data.totals.slice(1).map((minutes,i)=>({name:levelNames[i+1],minutes})):[{name:'Сон',minutes:data.sleep},{name:'Спокойный отдых',minutes:data.totals[0]-data.sleep}]).map(row=><div className="breakdown-row" key={row.name}><span>{row.name}</span><strong>{durationLabel(row.minutes)}</strong><small>{Math.round(row.minutes/(modal==='movement'?data.active:data.totals[0])*100)}%</small></div>)}<p className="footnote">Длительности суммируются за выбранный день.</p></>}
  </div></BottomSheet>
 </section>;
}
type MedicalFile = {id:string;name:string;type:string;size:number;added:number;blob:Blob};
function medicalStore<T>(mode:IDBTransactionMode,action:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T>{
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open('whoof-medical-records',1);
  request.onupgradeneeded=()=>{request.result.createObjectStore('documents',{keyPath:'id'});};
  request.onerror=()=>reject(request.error);
  request.onblocked=()=>reject(new Error('Storage blocked'));
  request.onsuccess=()=>{const db=request.result;let result:T;let transaction:IDBTransaction;
   try{transaction=db.transaction('documents',mode);const operation=action(transaction.objectStore('documents'));operation.onsuccess=()=>{result=operation.result;};}
   catch(error){db.close();reject(error);return;}
   transaction.oncomplete=()=>{db.close();resolve(result);};
   transaction.onabort=()=>{db.close();reject(transaction.error);};
   transaction.onerror=()=>{db.close();reject(transaction.error);};
  };
 });
}
const medicalSize=(size:number)=>size<1024*1024?`${Math.max(1,Math.round(size/1024))} КБ`:`${(size/1024/1024).toFixed(1).replace('.',',')} МБ`;
function MedicalRecordBlock(){
 const [files,setFiles]=useState<MedicalFile[]>([]),[open,setOpen]=useState(false),[selected,setSelected]=useState<string|null>(null);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[loadFailed,setLoadFailed]=useState(false),[confirmDelete,setConfirmDelete]=useState(false),[previewFailed,setPreviewFailed]=useState(false);
 const picker=useRef<HTMLInputElement>(null),keyboard=useKeyboard();
 const load=async()=>{setLoading(true);setError('');try{const saved=await medicalStore<MedicalFile[]>('readonly',store=>store.getAll());setFiles(saved.sort((a,b)=>b.added-a.added));setLoadFailed(false);}catch{setLoadFailed(true);setError('Не удалось открыть медкарту. Попробуйте ещё раз.');}finally{setLoading(false);}};
 useEffect(()=>{void load();},[]);
 const urls=useMemo(()=>new Map(files.map(file=>[file.id,URL.createObjectURL(file.blob)])),[files]);
 useEffect(()=>()=>urls.forEach(url=>URL.revokeObjectURL(url)),[urls]);
 const document=files.find(file=>file.id===selected),url=document?urls.get(document.id):undefined;
 const imageFile=document?.type.startsWith('image/')||/\.(png|jpe?g|webp|gif|heic|heif|tiff?|bmp)$/i.test(document?.name||'');
 const pdfFile=document?.type==='application/pdf'||/\.pdf$/i.test(document?.name||'');
 const chooseFiles=()=>{keyboard.hide();picker.current?.click();};
 const upload=async(incoming:File[])=>{
  if(!incoming.length)return;setBusy(true);setError('');const added:MedicalFile[]=[],failed:string[]=[];
  for(const file of incoming){
   if(!file.size){failed.push(`${file.name}: файл пустой`);continue;}
   if(file.size>20*1024*1024){failed.push(`${file.name}: больше 20 МБ`);continue;}
   if(!file.type.startsWith('image/')&&!/\.(pdf|docx?|rtf|txt|png|jpe?g|webp|gif|heic|heif|tiff?|bmp)$/i.test(file.name)){failed.push(`${file.name}: неподдерживаемый формат`);continue;}
   const type=file.type||(/\.pdf$/i.test(file.name)?'application/pdf':'application/octet-stream');
   const entry:MedicalFile={id:crypto.randomUUID(),name:file.name,type,size:file.size,added:Date.now(),blob:file.slice(0,file.size,type)};
   try{await medicalStore('readwrite',store=>store.put(entry));added.push(entry);}catch{failed.push(`${file.name}: не удалось сохранить, возможно, недостаточно места`);}
  }
  if(added.length)setFiles(current=>[...added.reverse(),...current]);setError(failed.join('. '));setBusy(false);
 };
 const remove=async()=>{if(!document)return;setBusy(true);setError('');try{await medicalStore('readwrite',store=>store.delete(document.id));setFiles(current=>current.filter(file=>file.id!==document.id));setSelected(null);setConfirmDelete(false);}catch{setError('Не удалось удалить файл. Попробуйте ещё раз.');}finally{setBusy(false);}};
 const show=()=>{keyboard.hide();setSelected(null);setConfirmDelete(false);setPreviewFailed(false);setOpen(true);};
 return <>
  <button className="medical-profile-card" onClick={show} aria-label="Открыть медкарту"><span className="medical-profile-icon"><FirstAidKit size={25}/></span><span><strong>Медкарта</strong><small>{loading?'Загружаем документы…':files.length?`Документов: ${files.length}`:'Анализы, назначения и прививки'}</small></span><CaretRight size={17}/></button>
  <input ref={picker} type="file" hidden multiple accept="image/*,.pdf,.doc,.docx,.rtf,.txt" aria-label="Загрузить документы в медкарту" onChange={e=>{const incoming=Array.from(e.currentTarget.files||[]);e.currentTarget.value='';void upload(incoming);}}/>
  <BottomSheet open={open} onOpenChange={value=>{if(!busy)setOpen(value);}} title={document?'Документ':'Медкарта'} description="" snap={.9}><div className="sheet-body medical-sheet">
   <button className="sheet-close icon-button" aria-label="Закрыть медкарту" disabled={busy} onClick={()=>setOpen(false)}><X size={19}/></button>
   {error&&<p className="medical-error" role="alert">{error}</p>}
   {document?<>
    <button className="text-button" onClick={()=>{setSelected(null);setConfirmDelete(false);setPreviewFailed(false);}} disabled={busy}><ArrowLeft size={16}/>Все документы</button>
    <h2 className="medical-filename">{document.name}</h2><p className="medical-file-meta">{medicalSize(document.size)} · Добавлено {new Date(document.added).toLocaleDateString('ru-RU')}</p>
    {imageFile&&!previewFailed?<div className="medical-image-preview"><img src={url} alt={document.name} onError={()=>setPreviewFailed(true)}/></div>:pdfFile?<iframe className="medical-pdf-preview" src={url} title={`Просмотр ${document.name}`}/>:<div className="medical-file-placeholder"><FileText size={44} weight="light"/><p>{previewFailed?'Для просмотра этого изображения скачайте оригинал.':'Скачайте документ, чтобы открыть его на устройстве.'}</p></div>}
    <a className="secondary full medical-download" href={url} download={document.name}><DownloadSimple size={18}/>Скачать оригинал</a>
    {confirmDelete?<div className="medical-delete-confirm"><p>Удалить этот документ из медкарты?</p><div className="button-pair"><button className="secondary" disabled={busy} onClick={()=>setConfirmDelete(false)}>Отмена</button><button className="primary" disabled={busy} onClick={()=>void remove()}>{busy?'Удаляем…':'Удалить документ'}</button></div></div>:<button className="text-button medical-remove" onClick={()=>setConfirmDelete(true)}><Trash size={16}/>Удалить файл</button>}
   </>:<>
    <p className="medical-description">Всё о здоровье питомца в одном месте.</p>
    <button className="primary full" disabled={loading||busy||loadFailed} onClick={chooseFiles}><Plus size={18}/>{busy?'Сохраняем…':'Добавить документы'}</button>
    <p className="medical-formats">Фото, скриншоты, PDF и документы · до 20 МБ на файл</p>
    {loading?<p className="medical-loading" role="status">Загружаем медкарту…</p>:loadFailed?<button className="secondary full" onClick={()=>void load()}>Попробовать снова</button>:files.length?<div className="medical-files"><div className="medical-list-label"><span>ДОКУМЕНТЫ</span><span>{files.length}</span></div>{files.map(file=><button className="medical-file-row" key={file.id} disabled={busy} onClick={()=>{setSelected(file.id);setConfirmDelete(false);setPreviewFailed(false);setError('');}}><span className="medical-file-icon">{file.type.startsWith('image/')?<ImageSquare size={24}/>:<FileText size={24}/>}</span><span><strong>{file.name}</strong><small>{new Date(file.added).toLocaleDateString('ru-RU')} · {medicalSize(file.size)}</small></span><CaretRight size={16}/></button>)}</div>:<div className="medical-empty"><span><FolderSimplePlus size={40} weight="light"/></span><h2>Пока нет документов</h2><p>Добавьте результаты анализов,<br/>назначения врача или ветпаспорт.</p></div>}
    <p className="medical-local-note"><LockSimple size={13}/>Файлы хранятся только в этом браузере.<br/>После очистки данных браузера они удалятся.</p>
   </>}
  </div></BottomSheet>
 </>;
}

// Public preview link contains no profile fields, documents or authorization credentials.
const INVITE_PREVIEW_TOKEN='whoof-preview';
function invitationUrl(){
 const url=new URL(window.location.origin);
 // Local demo: camera-scanned localhost URLs must resolve to the host Mac.
 if(['localhost','127.0.0.1','[::1]'].includes(url.hostname))url.hostname='192.168.1.179';
 url.searchParams.set('invite',INVITE_PREVIEW_TOKEN);
 return url.toString();
}
const sharedCategories=[
 {Icon:ChartBar,title:'Активность и показатели',text:'Карта дня, метрики и инсайты'},
 {Icon:FirstAidKit,title:'Профиль и медкарта',text:'Данные питомца и все документы'},
 {Icon:PawPrint,title:'Прогулки',text:'Общая история и новые маршруты'},
];
function SharedDataList(){return <div className="shared-data-list">{sharedCategories.map(({Icon,title,text})=><div key={title}><Icon size={21}/><span><strong>{title}</strong><small>{text}</small></span><Check size={16}/></div>)}</div>;}
function PetAccess({name,photo,isMember,onBack,onPreview,onOwner}:{name:string;photo:string;isMember:boolean;onBack:()=>void;onPreview:()=>void;onOwner:()=>void}){
 const [qr,setQr]=useState(''),[failed,setFailed]=useState(false),[message,setMessage]=useState(''),[showLink,setShowLink]=useState(false);
 const url=useMemo(invitationUrl,[]);
 useEffect(()=>{let active=true;QRCode.toDataURL(url,{width:720,margin:4,errorCorrectionLevel:'M',color:{dark:'#25292eff',light:'#ffffffff'}}).then(data=>{if(active)setQr(data);}).catch(()=>{if(active)setFailed(true);});return()=>{active=false;};},[url]);
 const copyLink=async()=>{try{if(!navigator.clipboard)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(url);setMessage('Ссылка скопирована');}catch{setShowLink(true);setMessage('Нажмите на ссылку, чтобы выделить и скопировать её.');}};
 const share=async()=>{if(navigator.share){try{await navigator.share({title:'Whoof — заботиться вместе',text:'Присоединяйтесь к профилю питомца в Whoof',url});return;}catch(error){if(error instanceof Error&&error.name==='AbortError')return;}}await copyLink();};
 return <>
  <header className="profile-page-header"><button className="icon-button" aria-label="Назад в настройки" onClick={onBack}><ArrowLeft size={23}/></button><h1>Доступ к питомцу</h1></header>
  {isMember?<><div className="access-member"><Users size={30}/><h2>Вы заботитесь вместе</h2><p>Вы — второй владелец питомца.</p></div><SharedDataList/><p className="invite-demo-note">Это предпросмотр совместного доступа. Реальная синхронизация ещё не подключена.</p><button className="secondary full" onClick={onOwner}>Посмотреть приглашение владельца</button></>:<>
   <div className="access-intro"><h2>Заботьтесь вместе</h2><p>Пригласите второго владельца.<br/>Профиль и история питомца будут общими.</p></div>
   <div className="invite-qr-card"><div className="invite-pet"><img src={photo} alt=""/><span>{name}</span></div>{qr?<img className="invite-qr" src={qr} alt="QR-код приглашения второго владельца"/>:<div className="invite-qr-loading">{failed?'Не удалось создать QR-код':'Готовим QR-код…'}</div>}<p>Откройте камеру второго телефона<br/>и наведите её на код</p></div>
   <button className="primary full invite-share" onClick={()=>void share()}><ShareNetwork size={20}/>Поделиться приглашением</button>
   <div className="invite-actions"><button className="text-button" onClick={()=>void copyLink()}><LinkSimple size={16}/>Скопировать ссылку</button>{qr&&<a className="text-button" href={qr} download="whoof-invitation.png"><DownloadSimple size={16}/>Сохранить QR</a>}</div>
   {message&&<p className="invite-feedback" role="status">{message}</p>}{showLink&&<KeyboardInput className="invite-link-input" readOnly value={url} aria-label="Ссылка приглашения" onClick={e=>e.currentTarget.select()}/>}
   <section className="access-scope"><h2>Что станет общим</h2><SharedDataList/><p>Новые данные будут появляться у обоих владельцев автоматически.</p></section>
   <p className="access-private">Переписка с AI и личные настройки остаются у каждого свои.</p>
   <button className="secondary full" onClick={onPreview}>Посмотреть приглашение<CaretRight size={17}/></button>
   <p className="invite-demo-note">QR открывает пример приглашения Джеки. Личные данные и документы в этой версии не передаются. Для проверки с другого телефона подключитесь к той же Wi-Fi сети.</p>
  </>}
 </>;
}
function JoinPet({name,breed,photo,preview,valid,onCancel,onAccept}:{name:string;breed:string;photo:string;preview:boolean;valid:boolean;onCancel:()=>void;onAccept:()=>void}){
 const [accepted,setAccepted]=useState(false);
 if(!valid)return <div className="join-pet"><LinkSimple size={36}/><h1>Приглашение не найдено</h1><p>Попросите владельца прислать новую ссылку.</p><button className="secondary full" onClick={onCancel}>Закрыть</button></div>;
 return <>
  <header className="invite-header"><button className="icon-button" aria-label="Закрыть приглашение" onClick={onCancel}><X size={22}/></button><span>{preview?'Предпросмотр приглашения':'Приглашение в Whoof'}</span></header>
  <div className="join-pet"><div className="join-avatar"><img src={photo} alt={name}/>{accepted&&<span><Check size={21}/></span>}</div><p className="eyebrow">{accepted?'СОВМЕСТНЫЙ ДОСТУП':'ЗАБОТА НА ДВОИХ'}</p><h1>{accepted?'Теперь вы заботитесь вместе':`Присоединиться к ${name==='Джека'?'Джеке':'профилю питомца'}?`}</h1><p>{name} · {breed}</p></div>
  {accepted?<><div className="invite-success-copy"><h2>Всё уже в одном профиле</h2><p>Показатели, прогулки и медкарта доступны обоим владельцам. Создавать питомца заново не нужно.</p></div><button className="primary full" onClick={onAccept}>{preview?'Завершить предпросмотр':'Открыть приложение'}</button></>:<><p className="join-explanation">Владелец приглашает вас заботиться о питомце вместе. После принятия станут доступны:</p><SharedDataList/><button className="primary full join-accept" onClick={()=>setAccepted(true)}>Присоединиться</button><button className="text-button join-decline" onClick={onCancel}>Не сейчас</button></>}
  <p className="invite-demo-note">Предпросмотр на данных Джеки: без регистрации и передачи личных документов.</p>
 </>;
}

export default function Whoof(){
 const [incomingInvite]=useState(()=>new URLSearchParams(window.location.search).get('invite'));
 const [previewInvite,setPreviewInvite]=useState(false),[isCoOwner,setIsCoOwner]=useState(false);
 const [unread,setUnread]=useState(true);
 const [profileFrom,setProfileFrom]=useState<Page>('settings');
 const [page,setPage]=useState<Page>(incomingInvite?'invite':'home'),[aiFrom,setAiFrom]=useState<Page>('home'),[sheet,setSheet]=useState<string|null>(null),[selectedDog,setSelectedDog]=useState(0),[invited,setInvited]=useState<string[]>([]);
 const [sharing,setSharing]=useState(false),[notifications,setNotifications]=useState(true),[zoom,setZoom]=useState(1),[walkTab,setWalkTab]=useState<'nearby'|'history'>('nearby'),[recording,setRecording]=useState(false),[paused,setPaused]=useState(false),[seconds,setSeconds]=useState(0);
 const [walks,setWalks]=useState<Walk[]>([{id:1,title:'Дневная прогулка',date:'Сегодня, 11:20',duration:'42 мин',distance:'2,4 км',friends:'С Боней и Анной'},{id:2,title:'Утренняя прогулка',date:'Сегодня, 07:30',duration:'35 мин',distance:'1,8 км',friends:'Вдвоём с Джекой'},{id:3,title:'Вечер в парке',date:'Вчера, 19:10',duration:'56 мин',distance:'3,2 км',friends:'С Ричи и Михаилом'}]);
 const [selectedWalk,setSelectedWalk]=useState<Walk|null>(null),[metric,setMetric]=useState(0),[period,setPeriod]=useState<MetricPeriod>('День');
 const [pet,setPet]=useState({name:'Джека',photo:DOG,breed:'Золотистый ретривер',age:'3 года',weight:'28,5',height:'',chronicConditions:'',sterilized:true}),[draft,setDraft]=useState(pet);
 const [message,setMessage]=useState(''),[messages,setMessages]=useState<{role:'user'|'assistant';text:string}[]>([]),[toast,setToast]=useState('');
 const photoPicker=useRef<HTMLInputElement>(null),photoTarget=useRef<'pet'|'draft'>('pet'),photoRequest=useRef(0);
 const [photoBusy,setPhotoBusy]=useState(false),[photoError,setPhotoError]=useState('');
 const choosePhoto=(target:'pet'|'draft')=>{keyboard.hide();setPhotoError('');photoTarget.current=target;photoPicker.current?.click();};
 const loadPhoto=(file:File|undefined)=>{
  if(!file)return;setPhotoError('');
  if(!file.type.startsWith('image/')){setPhotoError('Выберите изображение.');return;}
  if(file.size>10*1024*1024){setPhotoError('Фото должно быть не больше 10 МБ.');return;}
  const target=photoTarget.current,request=++photoRequest.current;setPhotoBusy(true);
  const reader=new FileReader();
  const fail=()=>{if(request===photoRequest.current){setPhotoError('Не удалось открыть фото. Попробуйте JPEG, PNG или WebP.');setPhotoBusy(false);}};
  reader.onerror=fail;reader.onload=()=>{if(request!==photoRequest.current)return;const src=String(reader.result),image=new Image();image.onerror=fail;image.onload=()=>{if(request!==photoRequest.current)return;if(target==='draft'){setDraft(current=>({...current,photo:src}));}else{setPet(current=>({...current,photo:src}));setDraft(current=>({...current,photo:src}));}setPhotoBusy(false);};image.src=src;};reader.readAsDataURL(file);
 };
 const keyboard=useKeyboard();const {bottomInset}=useKeyboardInsets();const chatEnd=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(page!=='ai'||!messages.length)return;const id=requestAnimationFrame(()=>{const scroller=chatEnd.current?.closest('[data-testid="mobile-scroll"]');scroller?.scrollTo({top:scroller.scrollHeight,behavior:'smooth'});});return()=>cancelAnimationFrame(id);},[messages,page]);
 useEffect(()=>{if(!recording||paused)return;const id=setInterval(()=>setSeconds(s=>s+1),1000);return()=>clearInterval(id);},[recording,paused]);
 useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(''),2800);return()=>clearTimeout(id);},[toast]);
 function navigate(p:Page){if(p==='profile'&&page!=='ai')setProfileFrom(page==='home'?'home':'settings');keyboard.hide();setToast('');setSheet(null);setPage(p);}function openAI(){setAiFrom(page);navigate('ai');}function openSheet(s:string){keyboard.hide();setSheet(s);}
 function send(text=message){const value=text.trim();if(!value)return;keyboard.hide();setMessage('');let answer=`Сегодня ${pet.name} был в движении 2 ч 15 мин и в покое 12 ч 15 мин. Основные периоды активности — утренняя и дневная прогулки. Сейчас он отдыхает.`;if(/сон|спит|спал/i.test(value))answer='За ночь записано 8 ч 40 мин сна. На графике нет долгих пробуждений. Для оценки изменений полезно сравнивать несколько дней, а не одну ночь.';else if(/гуля|прогул/i.test(value))answer='Сегодня уже сохранены две прогулки: 35 и 42 минуты, всего 4,2 км. Сейчас Джека отдыхает после дневной прогулки. Следующую прогулку можно записать в разделе «Прогулки».';else if(/пульс|дыхани|температур/i.test(value))answer='Средний пульс в покое — 72 уд/мин, дыхание — 22 вдоха/мин. Температура кожи у ошейника — 37,8 °C; это не температура тела.';else if(!/день|измен|актив|состоя|самочув|показател/i.test(value))answer='Могу помочь разобраться в активности, сне, показателях или прогулках Джеки. Что хотите обсудить?';setMessages(m=>[...m,{role:'user',text:value},{role:'assistant',text:answer}]);}
 function saveWalk(){const walk={id:Date.now(),title:'Новая прогулка',date:'Только что',duration:seconds<60?`${seconds} сек`:`${Math.floor(seconds/60)} мин`,distance:`${(seconds*.0013).toFixed(2).replace('.',',')} км`,friends:'Вдвоём с Джекой'};setWalks(w=>[walk,...w]);setRecording(false);setPaused(false);setWalkTab('history');setSelectedWalk(walk);setSheet('walk');setToast('Прогулка сохранена');}
 const time=`${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;
 const visibleMetrics=metricsForPeriod(period);
 const selectedMetric=visibleMetrics[metric];
 const navPage=page==='profile'||page==='access'?'settings':page;
 const nav=[{id:'home' as Page,label:'Главная',Icon:House},{id:'metrics' as Page,label:'Метрики',Icon:ChartBar},{id:'walks' as Page,label:'Прогулки',Icon:PawPrint},{id:'settings' as Page,label:'Настройки',Icon:GearSix}];
 return <div className="whoof-app" onFocusCapture={e=>{const frame=(e.target as HTMLElement).closest('[data-phone-screen]');if(frame instanceof HTMLElement)requestAnimationFrame(()=>frame.scrollTo({top:0,left:0}));}}><MobileScroll key={page} className="app-screen"><main className={`whoof-content page-${page} ${page==='home'?'home-content':''} ${page==='ai'?'chat-content':''} ${page==='settings'?'settings-content':''} ${page==='invite'?'invite-content':''}`}>
 {page==='home'&&<><header className="brand-header home-header"><button className="pet-picker" aria-label="Открыть профиль питомца" onClick={()=>navigate('profile')}><img src={pet.photo} alt={pet.name}/><span>{pet.name}</span><CaretDown size={16}/></button><button className="icon-button notification-button" aria-label="Уведомления" onClick={()=>{setUnread(false);openSheet('notifications');}}><Bell size={24}/>{unread&&<i/>}</button></header><section className="wellbeing"><h1>Самочувствие<br/><span>отличное</span></h1><p>Сейчас {pet.name} отдыхает после  дневной прогулки.</p></section><HomeActivity/></>}

 {page==='metrics'&&<><div className="page-top"><div><p className="eyebrow">{pet.name.toUpperCase()}</p><h1>Метрики</h1></div><AccentIcon icon={ChartBar} tone="purple"/></div><p className="intro metrics-intro">Всё важное о состоянии питомца.</p>
  <div className="segment metrics-period" role="group" aria-label="Период метрик">{metricPeriods.map(p=><button key={p} className={period===p?'active':''} aria-pressed={period===p} onClick={()=>setPeriod(p)}>{p}</button>)}</div>
  <p className="metrics-date">{metricDateRange(period)}</p>
  <div className="metric-tiles">{visibleMetrics.map((m,i)=><button className={`metric-tile ${i===visibleMetrics.length-1?'metric-tile-wide':''}`} aria-label={`Подробнее: ${m.name}`} key={m.name} onClick={()=>{setMetric(i);openSheet('metric');}}><div className="metric-tile-heading"><AccentIcon icon={m.icon} tone={metricTones[i]}/><CaretRight size={13}/></div><div className="metric-tile-bottom"><h2>{m.name}</h2><div className="metric-tile-value"><MetricNumber value={m.value}/>{m.unit&&<span>{m.unit}</span>}</div><p>{m.note}</p></div></button>)}</div></>}
 {page==='walks'&&<><div className="page-top"><div><p className="eyebrow">ВРЕМЯ ВМЕСТЕ</p><h1>Прогулки</h1></div><button className="icon-button" aria-label="Настройки геопозиции" onClick={()=>openSheet('location')}><MapPin size={25}/></button></div><div className="segment"><button className={walkTab==='nearby'?'active':''} onClick={()=>setWalkTab('nearby')}>Рядом</button><button className={walkTab==='history'?'active':''} onClick={()=>setWalkTab('history')}>Мои прогулки</button></div>{walkTab==='nearby'?<><div className="map-panel"><div className="map-world" style={{transform:`scale(${zoom})`}}><img src={MAP} alt="Демонстрационная карта района с парком"/>{dogs.map((d,i)=><button key={d.name} className="dog-pin" style={{left:`${d.x}%`,top:`${d.y}%`}} aria-label={`${d.name}, ${d.distance}`} onClick={()=>{setSelectedDog(i);openSheet('dog');}}><PawPrint weight="fill" size={21}/><span>{d.name}</span></button>)}<span className="my-location" style={{left:'58%',top:'44%'}}><NavigationArrow weight="fill" size={19}/></span></div><div className="map-controls"><button aria-label="Приблизить карту" disabled={zoom>=1.8} onClick={()=>setZoom(z=>Math.min(1.8,z+.2))}><Plus size={18}/></button><button aria-label="Отдалить карту" disabled={zoom<=1} onClick={()=>setZoom(z=>Math.max(1,z-.2))}><Minus size={18}/></button><button aria-label="Моя позиция" onClick={()=>{setZoom(1);setToast('Вы в центре карты');}}><NavigationArrow size={18}/></button></div></div><button className="sharing-row" onClick={()=>openSheet('location')}><span><MapPin size={17}/>{sharing?'Вы делитесь геопозицией':'Ваша геопозиция скрыта'}</span><CaretRight size={16}/></button>{recording?<div className="record-panel"><div className="record-top"><span>{paused?'Запись на паузе':'Прогулка записывается'}</span></div><div className="walk-stats"><div><strong>{time}</strong><span>Время</span></div><div><strong>{(seconds*.0013).toFixed(2).replace('.',',')}</strong><span>км</span></div></div><div className="button-pair"><button className="secondary" onClick={()=>setPaused(p=>!p)}>{paused?<Play/>:<Pause/>}{paused?'Продолжить':'Пауза'}</button><button className="primary" onClick={saveWalk}><Stop/>Завершить</button></div></div>:<button className="primary full" onClick={()=>{setSeconds(0);setPaused(false);setRecording(true);}}><Play weight="fill" size={18}/>Начать прогулку</button>}<div className="section-heading"><h2>Кто рядом</h2><span>3 собаки</span></div>{dogs.map((d,i)=><button key={d.name} className="nearby-row" onClick={()=>{setSelectedDog(i);openSheet('dog');}}><div className="pet-icon"><PawPrint size={24}/></div><div><strong>{d.name}</strong><p>{d.breed}</p></div><span>{invited.includes(d.name)?<Check size={18}/>:d.distance}</span><CaretRight size={15}/></button>)}</>:<><p className="intro small">Ваши маршруты и хорошие моменты.</p>{walks.map(w=><button className="history-row" key={w.id} onClick={()=>{setSelectedWalk(w);openSheet('walk');}}><div className="walk-thumb"><img src={MAP} alt=""/><Path size={26}/></div><div><span className="muted tiny">{w.date}</span><h3>{w.title}</h3><p>{w.duration} <span>·</span> {w.distance}</p><span className="tiny muted">{w.friends}</span></div><CaretRight size={16}/></button>)}</>}</>}
 {page==='settings'&&<>
  <div className="page-top"><h1>Настройки</h1></div>
  <button className="settings-invite-banner" aria-label="Доступ к питомцу: пригласить второго владельца" onClick={()=>navigate('access')}><AccentIcon icon={QrCode} tone="dark"/><span><strong>Забота на двоих</strong><small>{isCoOwner?'Общий доступ к питомцу':'Пригласить второго владельца'}</small></span><CaretRight size={15}/></button>
  <h2 className="settings-section-label">Питомец и устройство</h2>
  <section className="settings-group settings-destinations" aria-label="Питомец и устройство">
   <button className="settings-entry pet-entry" onClick={()=>navigate('profile')}><img src={pet.photo} alt=""/><span><strong>Профиль питомца</strong><small>{pet.name} · данные и здоровье</small></span><CaretRight size={17}/></button>
   <button className="settings-entry" onClick={()=>openSheet('collar')}><AccentIcon icon={Bluetooth} tone="blue"/><span><strong>Настройки устройства</strong><small>Whoof One · заряд 84%</small></span><CaretRight size={17}/></button>
  </section>
  {settingsGroups.map((group,index)=><section key={index} className="settings-group" aria-label={['Общие настройки','Информация','Помощь'][index]}><h2 className="settings-section-label">{['Общие настройки','Информация','Помощь'][index]}</h2>{group.map(({id,label,Icon})=><button key={id} className="settings-entry" onClick={()=>openSheet(id)}><AccentIcon icon={Icon} tone={settingTones[id]}/><span>{label}</span>{id==='language'&&<small>Русский</small>}<CaretRight size={16}/></button>)}</section>)}
 </>}
 {page==='access'&&<PetAccess name={pet.name} photo={pet.photo} isMember={isCoOwner} onBack={()=>navigate('settings')} onPreview={()=>{setPreviewInvite(true);navigate('invite');}} onOwner={()=>setIsCoOwner(false)}/>}
 {page==='invite'&&<JoinPet name={previewInvite?pet.name:'Джека'} breed={previewInvite?pet.breed:'Золотистый ретривер'} photo={previewInvite?pet.photo:DOG} preview={previewInvite} valid={previewInvite||incomingInvite===INVITE_PREVIEW_TOKEN} onCancel={()=>{if(!previewInvite)window.history.replaceState(null,'',window.location.pathname);navigate(previewInvite?'access':'home');}} onAccept={()=>{if(previewInvite){navigate('access');}else{window.history.replaceState(null,'',window.location.pathname);setIsCoOwner(true);navigate('home');}}}/>}
 {page==='profile'&&<>
  <header className="profile-page-header"><button className="icon-button" aria-label={profileFrom==='home'?'Назад на главную':'Назад в настройки'} onClick={()=>navigate(profileFrom)}><ArrowLeft size={23}/></button><h1>Профиль питомца</h1></header>
  <div className="profile-hero"><button className="pet-photo-button" disabled={photoBusy} aria-label="Изменить фото питомца" onClick={()=>choosePhoto('pet')}><img src={pet.photo} alt={pet.name}/><span><Camera size={17}/></span></button><button className="text-button photo-change-label" disabled={photoBusy} onClick={()=>choosePhoto('pet')}>{photoBusy?'Загружаем фото…':'Изменить фото'}</button>{photoError&&<p className="photo-error" role="alert">{photoError}</p>}<h2>{pet.name}</h2><p>{pet.breed}</p><button className="text-button" onClick={()=>{setPhotoError('');setDraft(pet);openSheet('edit');}}><PencilSimple size={15}/>Изменить данные</button></div>
  <section aria-label="Данные питомца" className="profile-data"><div><span>Возраст</span><strong>{pet.age}</strong></div><div><span>Вес</span><strong>{pet.weight} кг</strong></div><div><span>Порода</span><strong>{pet.breed}</strong></div><div><span>Стерилизация</span><strong>{pet.sterilized?'Да':'Нет'}</strong></div><div><span>Рост в холке</span><strong>{pet.height?`${pet.height} см`:'Не указан'}</strong></div><div className="chronic-row"><span>Хронические заболевания</span><strong>{pet.chronicConditions||'Не указаны'}</strong></div></section>

  <MedicalRecordBlock/>
 </>}
 {page==='ai'&&<><header className="ai-header"><button className="icon-button" aria-label="Назад" onClick={()=>navigate(aiFrom)}><ArrowLeft size={22}/></button><div><strong>Whoof AI</strong><span>Рядом, чтобы разобраться</span></div><Sparkle size={24}/></header><div className="context-chip"><img src={pet.photo} alt=""/><span>{pet.name} · данные за сегодня</span></div>{messages.length===0?<div className="chat-welcome"><AccentIcon icon={Sparkle} tone="purple"/><h1>Давайте<br/>разберёмся вместе</h1><p>Спросите об активности, отдыхе<br/>или показателях Джеки.</p><div className="suggestions">{['Как прошёл день Джеки?','Что изменилось в активности?','Как Джека спал?','Расскажи о прогулках'].map(q=><button onClick={()=>send(q)} key={q}>{q}<CaretRight size={16}/></button>)}</div></div>:<div className="messages">{messages.map((m,i)=><div key={i} className={`message ${m.role}`}>{m.role==='assistant'&&<span className="assistant-label"><Sparkle size={15}/>Whoof AI</span>}<p>{m.text}</p></div>)}<div ref={chatEnd}/></div>}</>}
 </main></MobileScroll>
 {page==='invite'?null:page!=='ai'?<nav className="bottom-nav" style={{bottom:bottomInset+8}} aria-label="Основная навигация"><div className="nav-capsule">{nav.map(({id,label,Icon})=><button key={id} onClick={()=>navigate(id)} aria-current={navPage===id?'page':undefined} className={navPage===id?'selected':''}><Icon size={25} weight="fill"/><span>{label}</span></button>)}</div><button className="ai-nav" aria-label="Обсудить с AI" onClick={openAI}><Sparkle size={25} weight="fill"/><span>AI</span></button></nav>:<form className="chat-composer" style={{bottom:bottomInset+8}} onSubmit={e=>{e.preventDefault();send();}}><KeyboardInput aria-label="Сообщение AI" value={message} onChange={e=>setMessage(e.target.value)} placeholder="Спросить о Джеке…"/><button onPointerDown={e=>e.preventDefault()} aria-label="Отправить сообщение" disabled={!message.trim()} type="submit"><ArrowUp size={22}/></button></form>}
 <input ref={photoPicker} type="file" accept="image/*" hidden aria-label="Выбрать фотографию питомца" onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';loadPhoto(file);}}/>
 {toast&&<div className="toast" role="status"><Check size={16}/>{toast}</div>}
 <BottomSheet open={sheet!==null} onOpenChange={o=>{if(!o)setSheet(null);}} title={sheet&&settingsTitles[sheet]?settingsTitles[sheet]:sheet==='notifications'?'Уведомления':sheet==='dog'?dogs[selectedDog].name:sheet==='metric'?metrics[metric].name:sheet==='walk'?'Детали прогулки':sheet==='edit'?'Данные питомца':sheet==='location'?'Геопозиция':sheet==='collar'?'Ошейник Whoof':sheet==='settings'?'Настройки':'О прототипе'} description="" snap={sheet==='edit'?.88:.72}><div className="sheet-body"><button className="sheet-close icon-button" aria-label="Закрыть" onClick={()=>{keyboard.hide();setSheet(null);}}><X size={19}/></button>
 {sheet==='notifications'&&<><button className="notification-row" onClick={()=>{setWalkTab('history');navigate('walks');}}><PawPrint size={23}/><div><strong>Прогулка сохранена</strong><p>Дневная прогулка: 42 минуты и 2,4 км.</p><span>Сегодня, 12:02</span></div><CaretRight size={16}/></button><button className="notification-row" onClick={()=>navigate('metrics')}><ChartBar size={23}/><div><strong>Новые данные Джеки</strong><p>Показатели активности и отдыха обновлены.</p><span>Сегодня, 14:30</span></div><CaretRight size={16}/></button><p className="footnote">Новых уведомлений нет — всё прочитано.</p></>}
 {sheet==='dog'&&<><div className="dog-detail"><div className="large-paw"><PawPrint size={38}/></div><h2>{dogs[selectedDog].name}</h2><p>{dogs[selectedDog].breed}</p><p>Хозяин: {dogs[selectedDog].owner} · {dogs[selectedDog].distance} от вас</p></div><div className="quiet-card"><Users size={21}/><p>Открыты к совместной прогулке в парке.</p></div><button className="primary full" disabled={invited.includes(dogs[selectedDog].name)} onClick={()=>{setInvited(a=>[...a,dogs[selectedDog].name]);setToast('Приглашение отправлено');}}>{invited.includes(dogs[selectedDog].name)?<><Check/>Приглашение отправлено</>:<><PawPrint/>Позвать на прогулку</>}</button></>}
 {sheet==='location'&&<><p className="intro small">Другие владельцы смогут увидеть вас на карте и пригласить на прогулку.</p><button className="settings-row" onClick={()=>setSharing(v=>!v)}><span>Делиться геопозицией</span><span className={`toggle ${sharing?'on':''}`} role="switch" aria-checked={sharing}><i/></span></button><p className="footnote">По умолчанию геопозиция скрыта.</p><button className="primary full" onClick={()=>setSheet(null)}>Готово</button></>}
 {sheet==='metric'&&<><div className="metric-detail-value">{selectedMetric.value}<small>{selectedMetric.unit}</small></div><div className="segment" role="group" aria-label="Период метрики">{metricPeriods.map(p=><button key={p} className={period===p?'active':''} aria-pressed={period===p} onClick={()=>setPeriod(p)}>{p}</button>)}</div><ActivityChart values={selectedMetric.values} axisLabels={metricAxisLabels(period)} tone={metricTones[metric]} label={`Динамика: ${selectedMetric.name} · ${period.toLowerCase()}`}/><div className="chart-period">{metricDateRange(period)}{period==='День'?' · до 14:30':''}</div><p className="intro small">{selectedMetric.note}</p><button className="primary full ai-primary" onClick={openAI}><Sparkle/>Обсудить с AI</button></>}

 {sheet==='walk'&&selectedWalk&&<><img className="detail-map" src={MAP} alt="Карта района прогулки"/><h2>{selectedWalk.title}</h2><p className="muted">{selectedWalk.date}</p><div className="walk-stats"><div><Clock size={19}/><strong>{selectedWalk.duration}</strong><span>Время</span></div><div><Path size={19}/><strong>{selectedWalk.distance}</strong><span>Дистанция</span></div></div><div className="quiet-card"><Users size={21}/><p>{selectedWalk.friends}</p></div></>}
 {sheet==='edit'&&<form className="pet-form" onSubmit={e=>{e.preventDefault();if(!draft.name.trim()||!draft.breed.trim()||!draft.age.trim())return;setPet({...draft,height:draft.height.trim(),chronicConditions:draft.chronicConditions.trim()});keyboard.hide();setSheet(null);setToast('Данные питомца обновлены');}}><div className="pet-form-photo"><button className="pet-photo-button" type="button" disabled={photoBusy} aria-label="Изменить фото питомца" onClick={()=>choosePhoto('draft')}><img src={draft.photo} alt={draft.name}/><span><Camera size={17}/></span></button><button className="text-button" type="button" disabled={photoBusy} onClick={()=>choosePhoto('draft')}>{photoBusy?'Загружаем фото…':'Изменить фото'}</button></div>{photoError&&<p className="photo-error" role="alert">{photoError}</p>}{[{key:'name',label:'Имя'},{key:'breed',label:'Порода'},{key:'age',label:'Возраст'},{key:'weight',label:'Вес, кг'},{key:'height',label:'Рост в холке, см'}].map(({key,label})=><label key={key}>{label}<KeyboardInput required={key!=='height'} value={String(draft[key as keyof typeof draft])} onChange={e=>setDraft({...draft,[key]:e.target.value})} inputMode={key==='weight'||key==='height'?'decimal':'text'} pattern={key==='weight'||key==='height'?'[0-9]+([.,][0-9]+)?':undefined}/></label>)}<button type="button" className="settings-row" onClick={()=>setDraft({...draft,sterilized:!draft.sterilized})}><span>Стерилизован</span><span className={`toggle ${draft.sterilized?'on':''}`} role="switch" aria-checked={draft.sterilized}><i/></span></button><label>Хронические заболевания<KeyboardTextarea aria-label="Хронические заболевания" value={draft.chronicConditions} onChange={e=>setDraft({...draft,chronicConditions:e.target.value})} placeholder="Укажите заболевания или напишите «Нет»" rows={3} maxLength={1000}/></label><button className="primary full" type="submit" disabled={photoBusy}>Сохранить</button></form>}
 {sheet==='collar'&&<><div className="collar-icon"><Bluetooth size={40}/></div><h2>Всё на связи</h2><p className="intro small">Ошейник {pet.name} передаёт данные в приложение.</p><div className="profile-data"><div><span>Заряд</span><strong>84%</strong></div><div><span>Последняя синхронизация</span><strong>2 мин назад</strong></div><div><span>Устройство</span><strong>Whoof One</strong></div></div><button className="primary full" onClick={()=>setToast('Данные синхронизированы')}>Синхронизировать</button></>}
 {sheet==='security'&&<><p className="intro small">Вы управляете тем, что видят другие владельцы.</p><button className="settings-row" onClick={()=>setSheet('location')}><MapPin size={21}/><span>Делиться геопозицией</span><small className="muted">{sharing?'Включено':'Выключено'}</small><CaretRight size={16}/></button><div className="quiet-card"><LockSimple size={22}/><p>Документы медкарты хранятся в этом браузере и не видны другим владельцам.</p></div></>}
 {sheet==='notification-settings'&&<><p className="intro small">События дня, изменения активности и напоминания об ошейнике.</p><button className="settings-row" role="switch" aria-label="Получать уведомления" aria-checked={notifications} onClick={()=>setNotifications(v=>!v)}><Bell size={21}/><span>Получать уведомления</span><span aria-hidden="true" className={`toggle ${notifications?'on':''}`}><i/></span></button></>}
 {sheet==='language'&&<><p className="intro small">Язык интерфейса</p><button className="settings-row" aria-pressed="true"><Globe size={21}/><span>Русский</span><Check size={20}/></button><p className="footnote">Сейчас доступен русский язык.</p></>}
 {sheet==='privacy'&&<><p className="intro small">Ваши данные и приватность</p><div className="settings-copy"><p>Документы медкарты сохраняются только в этом браузере. После очистки данных браузера они удалятся.</p><p>Геопозиция по умолчанию скрыта. Вы можете изменить это в настройках безопасности.</p><p>Полная политика обработки данных будет доступна перед запуском сервиса.</p></div><button className="secondary full" onClick={()=>setSheet('security')}>Настройки безопасности</button></>}
 {sheet==='terms'&&<div className="settings-copy"><p>Сейчас вы знакомитесь с прототипом Whoof. Показатели и инсайты показывают, как будет работать приложение.</p><p>Полные правила пользования будут доступны перед запуском сервиса.</p></div>}
 {sheet==='faq'&&<div className="settings-faq">{[
 ['Что показывает карта дня?','График показывает интенсивность движения. Перемещайте ползунок, чтобы выбрать момент и посмотреть период активности или покоя.'],
 ['Как изменить данные питомца?','Откройте профиль питомца в настройках и нажмите «Изменить данные». Здесь можно указать возраст, вес, породу, стерилизацию, рост в холке и хронические заболевания.'],
 ['Как добавить документы?','Откройте профиль питомца, затем медкарту. Нажмите «Добавить документы» и выберите фото, сканы или файлы.'],
 ['Почему инсайт начинается со слова «возможно»?','Трекер замечает изменения движения, но не знает их точную причину. Инсайт предлагает возможное объяснение.'],
 ].map(([question,answer])=><details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>}
 {sheet==='support'&&<><div className="quiet-card"><ChatCircle size={25}/><p>Поможем разобраться с ошейником, показателями и медкартой.</p></div><button className="settings-row" onClick={()=>setSheet('faq')}><Question size={21}/><span>Частые вопросы</span><CaretRight size={16}/></button><p className="footnote">Связь с командой поддержки появится после запуска сервиса.</p></>}
 {sheet==='about'&&<><span className="wordmark">whoof</span><p className="intro">Ближе к тому,<br/>кого любишь.</p><p>Кликабельный прототип приложения для заботы о собаке. Показатели, карта и ответы AI — демонстрационные.</p><p className="footnote">Настройки прототипа хранятся до перезагрузки. Документы медкарты сохраняются в этом браузере.</p></>}
 </div></BottomSheet></div>;
}
