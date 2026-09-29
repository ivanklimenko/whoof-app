import QRCode from 'qrcode';
import { createPortal } from 'react-dom';
import * as RecapDialog from '@radix-ui/react-dialog';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Eye, EyeSlash, Camera, QrCode, ShareNetwork, LinkSimple, FirstAidKit, FileText, ImageSquare, FolderSimplePlus, DownloadSimple, Trash, LockSimple, CalendarBlank, CaretLeft, Spinner, House, ChartBar, PawPrint, Globe, Info, ShieldCheck, Question, CircleNotch, CaretDown, CaretRight, ArrowLeft, ArrowUp, Plus, Minus, MapPin, NavigationArrow, Play, Pause, Stop, Check, X, Clock, Path, Users, GearSix, Bell, Bluetooth, Heart, Moon, ForkKnife, Drop, Lightning, PencilSimple, Sparkle } from '@phosphor-icons/react';
import { MobileScroll, Carousel, BottomSheet, KeyboardInput, KeyboardTextarea, useKeyboard, useKeyboardInsets } from './native';
import './prototype.css';

type Page = 'home' | 'metrics' | 'walks' | 'settings' | 'profile' | 'access' | 'invite' | 'ai';
type Walk = { id: number; title: string; date: string; duration: string; distance: string; friends: string; joint?:boolean };
const settingsGroups=[
 [{id:'security',label:'Настройки безопасности',Icon:LockSimple},{id:'notification-settings',label:'Уведомления',Icon:Bell},{id:'language',label:'Язык',Icon:Globe}],
 [{id:'about',label:'О нас',Icon:Info},{id:'privacy',label:'Политика приватности',Icon:ShieldCheck},{id:'terms',label:'Правила пользования',Icon:FileText}],
 [{id:'faq',label:'Помощь',Icon:Question}],
];
const settingsTitles:Record<string,string>={security:'Настройки безопасности','notification-settings':'Уведомления',language:'Язык',about:'О нас',privacy:'Политика приватности',terms:'Правила пользования',faq:'Помощь',collar:'Настройки устройства'};
const DOG = import.meta.env.BASE_URL+'assets/whoof/dog-color.png', MAP = import.meta.env.BASE_URL+'assets/whoof/park-map.png';
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
const metricTones:ChartTone[]=['blue','purple'];
const settingTones:Record<string,string>={security:'purple','notification-settings':'coral',language:'blue',about:'cyan',privacy:'green',terms:'orange',faq:'purple',support:'pink'};
const dogs = [{name:'Боня',breed:'Корги · 2 года',owner:'Анна',distance:'150 м',x:35,y:34},{name:'Ричи',breed:'Бигль · 4 года',owner:'Михаил',distance:'320 м',x:72,y:53},{name:'Луна',breed:'Лабрадор · 3 года',owner:'Мария',distance:'480 м',x:46,y:76}];
const metrics = [{name:'Движение',icon:Lightning},{name:'Сон',icon:Moon}];
type MetricPeriod = 'День' | 'Неделя' | 'Месяц';
type ChatMessage = {role:'user'|'assistant';text:string};
type MetricChatContext = {kind:'metric';key:string;name:string;period:MetricPeriod;range:string;value:string;unit:string;note:string;detail:string};
const metricPeriods:MetricPeriod[]=['День','Неделя','Месяц'];
function metricDays(period:MetricPeriod){
 const today=dateKey(new Date()),count=period==='День'?1:period==='Неделя'?7:30;
 // Averages use completed days; today's partial snapshot is shown only in Day.
 return Array.from({length:count},(_,i)=>period==='День'?today:moveDate(today,i-count));
}
function metricDay(key:string){
 const day=makeDayData(key,dateKey(new Date()));
 // Local classified-behaviour fixtures, sharing totals with the Home day map.
 const running=day.totals[4],walking=day.active-running,night=420,nap=day.sleep-night;
 return {...day,key,running,walking,night,nap,sleepPeriods:[{start:0,end:night,label:'Ночной сон'},{start:540,end:540+nap,label:'Дневной сон'}]};
}
function metricsForPeriod(period:MetricPeriod){
 const days=metricDays(period).map(metricDay),day=days[0];
 const avg=(key:'active'|'walking'|'running'|'sleep'|'night'|'nap')=>Math.round(days.reduce((sum,d)=>sum+d[key],0)/days.length);
 const moving=avg('active'),running=avg('running'),walking=moving-running,sleep=avg('sleep'),night=avg('night'),nap=sleep-night;
 const hours=Array.from({length:Math.ceil(day.end/60)},(_,i)=>i);
 const movementValues=hours.map(hour=>day.levels.slice(hour*4,hour*4+4).filter(level=>level>0).length*15);
 const sleepValues=hours.map(hour=>day.sleepPeriods.reduce((sum,block)=>sum+Math.max(0,Math.min(block.end,(hour+1)*60)-Math.max(block.start,hour*60)),0));
 return [
  {...metrics[0],value:durationLabel(moving),unit:'',note:period==='День'?`Из них ${durationLabel(running)} бега`:'В среднем за день',values:period==='День'?movementValues:days.map(d=>d.active),rows:[{label:'Ходьба',value:durationLabel(walking)},{label:'Бег',value:durationLabel(running)}],detail:`Ходьба — ${durationLabel(walking)}, бег — ${durationLabel(running)}${period==='День'?'':' в среднем за день'}.`,idle:period==='День'?durationLabel(day.end-day.active):null},
  {...metrics[1],value:durationLabel(sleep),unit:'',note:period==='День'?'Ночной и дневной сон':'В среднем за день',values:period==='День'?sleepValues:days.map(d=>d.sleep),rows:[{label:'Ночью',value:durationLabel(night)},{label:'Днём',value:durationLabel(nap)}],detail:`Ночной сон — ${durationLabel(night)}, дневной — ${durationLabel(nap)}${period==='День'?'':' в среднем за день'}.`,idle:null},
 ];
}
function metricDateRange(period:MetricPeriod){
 const days=metricDays(period);
 return period==='День'?`Сегодня, ${dateLabel(days[0])}`:`${dateLabel(days[0])} — ${dateLabel(days[days.length-1])}`;
}
function metricAxisLabels(period:MetricPeriod){
 if(period==='День')return Array.from({length:15},(_,i)=>`${String(i).padStart(2,'0')}:00`);
 return metricDays(period).map(key=>period==='Неделя'?fromKey(key).toLocaleDateString('ru-RU',{weekday:'short'}):String(fromKey(key).getDate()));
}
type NutritionKind='food'|'water';
function nutritionEvents(key:string){
 const times:{kind:NutritionKind;time:string}[]=[{kind:'food',time:'08:15'},{kind:'water',time:'08:27'},{kind:'water',time:'12:55'}];
 if(key!==dateKey(new Date()))times.push({kind:'food',time:'18:40'},{kind:'water',time:'19:00'},{kind:'water',time:'21:10'});
 return times.map(event=>({...event,key}));
}
function NutritionEvents({period,onOpen}:{period:MetricPeriod;onOpen:(kind:NutritionKind)=>void}){
 const days=metricDays(period),events=days.flatMap(nutritionEvents),today=period==='День';
 return <section className="nutrition-section"><div className="section-heading"><h2>Еда и вода</h2><span>{today?'Сегодня':'За период'}</span></div><p className="nutrition-intro">{today?'Когда питомец ел и пил.':'Дни, в которые распознаны еда и питьё.'}</p><div className="nutrition-list">
  {today?events.map(event=><button className="nutrition-row" key={`${event.kind}-${event.time}`} onClick={()=>onOpen(event.kind)}><AccentIcon icon={event.kind==='food'?ForkKnife:Drop} tone={event.kind==='food'?'orange':'cyan'}/><span><strong>{event.kind==='food'?'Еда':'Вода'}</strong><small>Распознан эпизод</small></span><time>{event.time}</time><CaretRight size={14}/></button>):(['food','water'] as const).map(kind=><button className="nutrition-row" key={kind} onClick={()=>onOpen(kind)}><AccentIcon icon={kind==='food'?ForkKnife:Drop} tone={kind==='food'?'orange':'cyan'}/><span><strong>{kind==='food'?'Еда':'Вода'}</strong><small>Дней с записями</small></span><b>{days.filter(key=>nutritionEvents(key).some(e=>e.kind===kind)).length} из {days.length}</b><CaretRight size={14}/></button>)}
 </div><p className="nutrition-footnote">По движениям определяем события, а не количество еды или воды.</p></section>;
}
function MetricNumber({value}:{value:string}){
 if(!value.includes(' ч'))return <strong>{value}</strong>;
 return <strong className="metric-duration">{Array.from(value.matchAll(/(\d+)\s*(ч|мин)/g),match=><span key={match[2]}>{Number(match[1])}<small> {match[2]}</small></span>)}</strong>;
}
function MetricDurationChart({values,period,tone}:{values:number[];period:MetricPeriod;tone:ChartTone}){
 const id=useId(),max=Math.max(60,Math.ceil(Math.max(...values)/60)*60),labels=metricAxisLabels(period),step=270/values.length;
 return <figure className="metric-duration-chart"><figcaption>{period==='День'?'Минуты за час':'Продолжительность за день'}</figcaption><svg viewBox="0 0 340 190" role="img" aria-label={`Продолжительность, ${period.toLowerCase()}. ${values.map((v,i)=>`${labels[i]}: ${durationLabel(v)}`).join('; ')}`}><defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop stopColor={chartPalette[tone][0]}/><stop offset="1" stopColor={chartPalette[tone][1]}/></linearGradient></defs>
  {[0,1,2].map(i=><g key={i}><line x1="60" x2="330" y1={18+i*64} y2={18+i*64} stroke="#ededed"/><text x="53" y={21+i*64} textAnchor="end">{max<=60?`${max-i*max/2}`:durationLabel(Math.round(max-i*max/2))}</text></g>)}
  {values.map((v,i)=><g key={i}><rect x={60+i*step+step*.22} y={146-v/max*128} width={step*.56} height={v/max*128} rx="3" fill={`url(#${id})`}><title>{labels[i]} · {durationLabel(v)}</title></rect>{(period==='Неделя'||i===(values.length-1)||i%(period==='День'?3:5)===0)&&<text x={60+(i+.5)*step} y="169" textAnchor="middle">{labels[i]}</text>}</g>)}
 </svg></figure>;
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
  {id:`${day}-social`,index:30+(isToday?0:seed%3),kind:'social',title:'Возможно, встретил друга',description:'Во время прогулки спокойное движение сменилось коротким периодом интенсивной активности.',evidence:'На графике — переход от низкой активности к очень высокой за несколько отрезков.'},
  {id:`${day}-play`,index:49+(isToday?0:seed%2),kind:'play',title:'Похоже, увлёкся игрой',description:'После короткого периода интенсивного движения Джека постепенно перешёл к отдыху.',evidence:'После всплеска активность постепенно снижается: от высокой к низкой, затем к покою.'}
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
type HomeRestore={day:string;selected:number;modal:'movement'|'rest'|'insight'|null;insight:DayInsight|null};
type HomeChatContext={kind:'summary'|'insight';key:string;name:string;period:'День';range:string;value:string;unit:string;note:string;response:string;restore:HomeRestore};
type ChatContext=MetricChatContext|HomeChatContext;
function HomeActivity({onDiscuss,restore}:{onDiscuss:(context:HomeChatContext)=>void;restore:HomeRestore|null}){
 const [today]=useState(()=>dateKey(new Date())),[day,setDay]=useState(restore?.day||today),[selected,setSelected]=useState(restore?.selected??870);
 const [modal,setModal]=useState<'calendar'|'movement'|'rest'|'insight'|null>(restore?.modal||null),[month,setMonth]=useState(()=>{const d=fromKey(today);d.setDate(1);return dateKey(d);});
 const [activeInsight,setActiveInsight]=useState<DayInsight|null>(restore?.insight||null);
 const sectionRef=useRef<HTMLElement>(null);
 useEffect(()=>{if(!restore)return;const frame=requestAnimationFrame(()=>{const target=restore.insight?sectionRef.current:sectionRef.current?.querySelector('.day-summary');target?.scrollIntoView({block:'start'});});return()=>cancelAnimationFrame(frame);},[]);
 const earliest=moveDate(today,-29),data=useMemo(()=>makeDayData(day,today),[day,today]);
 const insights=useMemo(()=>makeDayInsights(day,today),[day,today]);
 const openInsight=(insight:DayInsight)=>{setSelected(insight.index*15+7);setActiveInsight(insight);setModal('insight');};
 const chooseDay=(key:string)=>{if(key<earliest||key>today)return;setDay(key);setSelected(makeDayData(key,today).end);setActiveInsight(null);setModal(null);};
 const shiftMonth=(delta:number)=>{const d=fromKey(month);d.setMonth(d.getMonth()+delta);setMonth(dateKey(d));};
 const monthDate=fromKey(month),offset=(monthDate.getDay()+6)%7,monthLength=new Date(monthDate.getFullYear(),monthDate.getMonth()+1,0).getDate();
 const cells=Array.from({length:Math.ceil((offset+monthLength)/7)*7},(_,i)=>{const n=i-offset+1;return n>0&&n<=monthLength?n:null;});
 const period=activityPeriod(data.levels,selected);
 const selectedInsight=insights.find(insight=>insight.index*15>=period.start&&insight.index*15<period.end);
 const range=`${dateLabel(day)} · ${day===today?'до 14:30':'полный день'}`;
 const discussSummary=(kind:'movement'|'rest',fromDetails=false)=>{
  const moving=kind==='movement',name=moving?'В движении':'В покое',value=durationLabel(moving?data.active:data.totals[0]);
  const note=moving?data.totals.slice(1).map((minutes,i)=>`${levelNames[i+1]} — ${durationLabel(minutes)}`).join('; '):`Сон — ${durationLabel(data.sleep)}; спокойный отдых — ${durationLabel(data.totals[0]-data.sleep)}`;
  onDiscuss({kind:'summary',key:`summary:${day}:${kind}`,name,period:'День',range,value,unit:'',note,response:`${name} за ${range}: ${value}. ${note}. Это длительности за выбранный день; для оценки изменений стоит сравнить их с привычным режимом питомца.`,restore:{day,selected,modal:fromDetails?kind:null,insight:null}});
 };
 const discussInsight=()=>{
  if(!activeInsight)return;
  const time=timeLabel(activeInsight.index*15+7);
  onDiscuss({kind:'insight',key:`insight:${activeInsight.id}`,name:'Инсайт',period:'День',range:`${dateLabel(day)} · ${time}`,value:activeInsight.title,unit:'',note:activeInsight.description,response:`${dateLabel(day)}, ${time}. ${activeInsight.title}. ${activeInsight.evidence} ${activeInsight.description} Причину этих движений трекер определить не может: встреча или игра — предположение, а не подтверждённое событие.`,restore:{day,selected,modal:'insight',insight:activeInsight}});
 };
 return <section ref={sectionRef} className="activity-section activity-explorer">
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
  <div className="day-cards"><article className="day-card"><button className="day-card-details" aria-label="В движении: разбивка по интенсивности" onClick={()=>setModal('movement')}><span className="day-card-top"><AccentIcon icon={Lightning}/><CaretRight size={14}/></span><span className="day-card-title">В движении</span><div className="day-total"><MetricNumber value={durationLabel(data.active)}/></div><div className="intensity-bar" aria-hidden="true">{data.totals.slice(1).map((minutes,i)=><span key={i} style={{flex:minutes,background:['#d9e6ff','#a6c3ff','#6e9dff','#3972ed'][i]}}/>)}</div><p><b>{durationLabel(data.totals[4])}</b> — очень высокая активность</p></button></article><article className="day-card"><button className="day-card-details" aria-label="В покое: сон и отдых" onClick={()=>setModal('rest')}><span className="day-card-top"><AccentIcon icon={Moon} tone="purple"/><CaretRight size={14}/></span><span className="day-card-title">В покое</span><div className="day-total"><MetricNumber value={durationLabel(data.totals[0])}/></div><div className="intensity-bar" aria-hidden="true"><span style={{flex:data.sleep,background:'#a58aef'}}/><span style={{flex:data.totals[0]-data.sleep,background:'#eee8fb'}}/></div><p><b>{durationLabel(data.sleep)}</b> — сон<br/>Остальное — отдых</p></button></article></div>
  </section>
  <BottomSheet open={modal!==null} onOpenChange={open=>{if(!open)setModal(null);}} title={modal==='insight'?'Инсайт':modal==='calendar'?'Выберите день':modal==='movement'?'В движении':'Сон и отдых'} description="" snap={.76}><div className="sheet-body"><button className="sheet-close icon-button" aria-label="Закрыть окно активности" onClick={()=>setModal(null)}><X size={19}/></button>
  {modal==='insight'&&activeInsight?<div className="day-insight-detail"><div className="insight-context"><span className="insight-kind-icon">{activeInsight.kind==='social'?<PawPrint size={27}/>:<Lightning size={27}/>}</span><span>{dateLabel(day)}<br/><strong>{timeLabel(activeInsight.index*15+7)}</strong></span></div><h2>{activeInsight.title}</h2><p className="insight-description">{activeInsight.description}</p><section className="insight-evidence"><h3>Что заметил трекер</h3><p>{activeInsight.evidence}</p></section><p className="insight-disclaimer">Это возможное объяснение: по метрикам нельзя точно определить причину всплеска активности.</p><button className="primary full ai-primary" onClick={discussInsight}><Sparkle/>Обсудить с AI</button><button className="text-button insight-return" onClick={()=>setModal(null)}>К графику<CaretRight size={17}/></button></div>:modal==='calendar'?<div className="calendar"><div className="calendar-month"><button className="icon-button" aria-label="Предыдущий месяц" disabled={month.slice(0,7)<=earliest.slice(0,7)} onClick={()=>shiftMonth(-1)}><CaretLeft size={19}/></button><strong>{monthDate.toLocaleDateString('ru-RU',{month:'long',year:'numeric'}).replace(' г.','')}</strong><button className="icon-button" aria-label="Следующий месяц" disabled={month.slice(0,7)>=today.slice(0,7)} onClick={()=>shiftMonth(1)}><CaretRight size={19}/></button></div><table><thead><tr>{['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d=><th key={d}>{d}</th>)}</tr></thead><tbody>{Array.from({length:cells.length/7},(_,row)=><tr key={row}>{cells.slice(row*7,row*7+7).map((n,i)=>{if(n===null)return <td key={i}/>;const key=`${month.slice(0,7)}-${String(n).padStart(2,'0')}`;return <td key={i}><button className={`${key===day?'chosen':''} ${key===today?'is-today':''}`} aria-pressed={key===day} aria-label={fromKey(key).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})} disabled={key>today||key<earliest} onClick={()=>chooseDay(key)}>{n}</button></td>;})}</tr>)}</tbody></table><button className="secondary full" onClick={()=>chooseDay(today)}>Сегодня, {dateLabel(today)}</button><p className="footnote">Доступны последние 30 дней.</p></div>:<><p className="breakdown-date">{dateLabel(day)} · {day===today?'до 14:30':'полный день'}</p><strong className="breakdown-total">{durationLabel(modal==='movement'?data.active:data.totals[0])}</strong>{(modal==='movement'?data.totals.slice(1).map((minutes,i)=>({name:levelNames[i+1],minutes})):[{name:'Сон',minutes:data.sleep},{name:'Спокойный отдых',minutes:data.totals[0]-data.sleep}]).map(row=><div className="breakdown-row" key={row.name}><span>{row.name}</span><strong>{durationLabel(row.minutes)}</strong><small>{Math.round(row.minutes/(modal==='movement'?data.active:data.totals[0])*100)}%</small></div>)}<p className="footnote">Длительности суммируются за выбранный день.</p><button className="primary full ai-primary" onClick={()=>discussSummary(modal==='movement'?'movement':'rest',true)}><Sparkle/>Обсудить с AI</button></>}
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
 const url=new URL(import.meta.env.BASE_URL,window.location.origin);
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
  {isMember?<><div className="access-member"><Users size={30}/><h2>Вы заботитесь вместе</h2><p>Вы — второй владелец питомца.</p></div><SharedDataList/><p className="invite-demo-note">Это предпросмотр совместного доступа. Реальная синхронизация ещё не подключена.</p><details className="prototype-tools"><summary>Проверить сценарий приглашения</summary><button className="text-button" onClick={onOwner}>Вернуться к роли владельца</button></details></>:<>
   <div className="access-intro"><h2>Заботьтесь вместе</h2><p>Пригласите второго владельца.<br/>Профиль и история питомца будут общими.</p></div>
   <div className="invite-qr-card"><div className="invite-pet"><img src={photo} alt=""/><span>{name}</span></div>{qr?<img className="invite-qr" src={qr} alt="QR-код приглашения второго владельца"/>:<div className="invite-qr-loading">{failed?'Не удалось создать QR-код':'Готовим QR-код…'}</div>}<p>Откройте камеру второго телефона<br/>и наведите её на код</p></div>
   <button className="primary full invite-share" onClick={()=>void share()}><ShareNetwork size={20}/>Поделиться приглашением</button>
   <details className="invite-more"><summary>Другие способы</summary><div className="invite-actions"><button className="text-button" onClick={()=>void copyLink()}><LinkSimple size={16}/>Скопировать ссылку</button>{qr&&<a className="text-button" href={qr} download="whoof-invitation.png"><DownloadSimple size={16}/>Сохранить QR</a>}</div></details>
   {message&&<p className="invite-feedback" role="status">{message}</p>}{showLink&&<KeyboardInput className="invite-link-input" readOnly value={url} aria-label="Ссылка приглашения" onClick={e=>e.currentTarget.select()}/>}
   <section className="access-scope"><h2>Что станет общим</h2><SharedDataList/><p>Новые данные будут появляться у обоих владельцев автоматически.</p></section>
   <p className="access-private">Переписка с AI и личные настройки остаются у каждого свои.</p>
   <details className="prototype-tools"><summary>Проверить сценарий приглашения</summary><button className="text-button" onClick={onPreview}>Предпросмотр для второго владельца<CaretRight size={17}/></button></details>
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

// Source: Whoof Activity Classes (1).xlsx, sheet Задания. See TASKS.md.
const petTasks = [
 {"id": "lying", "title": "Полежать на боку", "description": "Попросите питомца спокойно полежать на боку одну минуту. Сразу после действия нажмите кнопку готово.", "duration": "1 минута", "tone": "purple", "mode": "Retrospective", "context": "Минутка покоя", "why": "Поможет сопоставить спокойное положение питомца с показаниями ошейника.", "hint": "Нажмите «Готово» сразу после действия.", "sourceRow": 2,Icon:Moon},
 {"id": "walking", "title": "Идти ровно одну минуту", "description": "Пройдите с питомцем одну минуту в обычном темпе без остановок. Сразу после действия нажмите кнопку готово.", "duration": "1 минута", "tone": "blue", "mode": "Interval", "context": "На прогулке", "why": "Поможет проверить, как трекер распознаёт обычную ходьбу.", "hint": "Нажмите «Начать» перед ходьбой, а «Готово» — сразу после.", "sourceRow": 29,Icon:PawPrint},
 {"id": "body-shaking", "title": "Отряхнуться после сна", "description": "Сразу отметьте первое естественное отряхивание всем телом после пробуждения.", "duration": "Когда заметите", "tone": "orange", "mode": "Instant", "context": "После сна", "why": "Поможет отличать короткое отряхивание от других движений.", "hint": "Заметили отряхивание? Сразу нажмите «Готово».", "sourceRow": 172,Icon:Lightning},
 {"id": "sitting", "title": "Посидеть тридцать секунд", "description": "Попросите питомца спокойно посидеть тридцать секунд. Сразу после действия нажмите кнопку готово.", "duration": "30 секунд", "tone": "purple", "mode": "Retrospective", "context": "Спокойная пауза", "why": "Поможет узнать движения питомца в спокойной позе.", "hint": "Нажмите «Готово» сразу после действия.", "sourceRow": 12,Icon:PawPrint},
 {"id": "sleeping", "title": "Начало дневного сна", "description": "Сразу отметьте момент, когда питомец естественно уснул днем.", "duration": "Когда уснёт", "tone": "purple", "mode": "Retrospective", "context": "Сладкий сон", "why": "Поможет сопоставить начало сна с данными ошейника.", "hint": "Нажмите «Готово», когда питомец уснёт.", "sourceRow": 21,Icon:Moon},
 {"id": "sniffing", "title": "Нюхать землю без движения", "description": "Дайте питомцу тридцать секунд нюхать один участок земли почти без движения. Сразу после действия нажмите кнопку готово.", "duration": "30 секунд", "tone": "blue", "mode": "Retrospective", "context": "Интересный запах", "why": "Поможет отличать обнюхивание от ходьбы.", "hint": "Нажмите «Готово» сразу после действия.", "sourceRow": 97,Icon:PawPrint},
 {"id": "searching", "title": "Найти один кусочек с помощью нюха", "description": "Спрячьте один кусочек лакомства в доступном месте и предложите питомцу найти его. Сразу после действия нажмите кнопку готово.", "duration": "В своём темпе", "tone": "orange", "mode": "Interval", "context": "Игра в поиск", "why": "Поможет сравнить движения во время поиска с обычным шагом.", "hint": "Нажмите «Начать» перед поиском, а «Готово» — сразу после.", "sourceRow": 119,Icon:PawPrint},
 {"id": "eating", "title": "Есть корм из миски", "description": "Дайте обычную порцию сухого/влажного корма в привычной миске и сразу отметьте начало еды.", "duration": "Во время еды", "tone": "orange", "mode": "Retrospective", "context": "Время подкрепиться", "why": "Поможет сопоставить привычный приём пищи с движениями питомца.", "hint": "Нажмите «Готово», когда питомец начнёт есть.", "sourceRow": 128,Icon:Heart},
 {"id": "drinking", "title": "Сделать несколько глотков", "description": "Сразу отметьте короткое питье, когда питомец делает всего несколько глотков.", "duration": "Когда пьёт", "tone": "blue", "mode": "Retrospective", "context": "Немного воды", "why": "Поможет узнать характерные движения во время питья.", "hint": "Нажмите «Готово» сразу, когда заметите питьё.", "sourceRow": 138,Icon:CircleNotch},
 {"id": "head-shaking", "title": "Быстро потрясти головой", "description": "Сразу отметьте естественную быструю тряску преимущественно головой.", "duration": "Когда заметите", "tone": "orange", "mode": "Instant", "context": "Знакомое движение", "why": "Поможет отличать тряску головой от отряхивания всем телом.", "hint": "Нажмите «Готово» сразу после естественного движения.", "sourceRow": 195,Icon:Lightning},
 {"id": "head-turning", "title": "Повернуть голову влево", "description": "Медленно переместите руку влево и дайте питомцу проследить за ней головой. Сразу после действия нажмите кнопку готово.", "duration": "Одно движение", "tone": "blue", "mode": "Instant", "context": "Смотрим по сторонам", "why": "Поможет сопоставить повороты головы с сигналами трекера.", "hint": "Нажмите «Готово» сразу после действия.", "sourceRow": 204,Icon:PawPrint},
 {"id": "petting", "title": "Спокойное поглаживание", "description": "Погладьте питомца около минуты, пока он спокойно сидит или стоит. Сразу после действия нажмите кнопку готово.", "duration": "1 минута", "tone": "purple", "mode": "Retrospective", "context": "Минута нежности", "why": "Поможет понять, как обычный уход отражается в движениях питомца.", "hint": "Нажмите «Готово» сразу после действия.", "sourceRow": 275,Icon:Heart},
];
const dailyTaskIds=['lying','walking','body-shaking','sitting'];
const dailyTasks=petTasks.filter(task=>dailyTaskIds.includes(task.id));
type TaskOutcome='yes'|'partly'|'no';
type TaskResult={outcome:TaskOutcome;note:string;markedAt:number;startedAt?:number};
type TaskProgress={results:Record<string,TaskResult>;active:{id:string;started:number}|null};
// Fresh prototype progress requested by the owner; future completions still persist.
const taskStorageKey='whoof.pet-tasks.catalog-v2';
const taskOutcomeLabels:Record<TaskOutcome,string>={yes:'Всё получилось',partly:'Получилось частично',no:'Не получилось'};
function readTaskProgress():TaskProgress{
 try{
  const saved=JSON.parse(localStorage.getItem(taskStorageKey)||'null');
  const results:Record<string,TaskResult>={};
  for(const task of petTasks){const r=saved?.results?.[task.id];if(r&&['yes','partly','no'].includes(r.outcome)&&typeof r.note==='string'&&Number.isFinite(r.markedAt))results[task.id]={outcome:r.outcome,note:r.note,markedAt:r.markedAt,...(Number.isFinite(r.startedAt)?{startedAt:r.startedAt}:{})};}
  const a=saved?.active;
  const active=a&&petTasks.some(t=>t.id===a.id&&t.mode==='Interval')&&typeof a.started==='number'&&Number.isFinite(a.started)&&a.started>0&&a.started<=Date.now()?a:null;
  return {results,active};
 }catch{return {results:{},active:null};}
}
function usePetTasks(){
 const [progress,setProgress]=useState<TaskProgress>(readTaskProgress);
 const [storageError,setStorageError]=useState(false);
 // One-time preview reset requested by the owner; later completions still persist.
 useEffect(()=>{try{
  const resetKey='whoof.pet-tasks.preview-reset',revision='2026-09-25-sheet-preview';
  if(localStorage.getItem(resetKey)!==revision){
   const empty:TaskProgress={results:{},active:null};
   localStorage.setItem(taskStorageKey,JSON.stringify(empty));localStorage.setItem(resetKey,revision);
   setProgress(empty);setStorageError(false);return;
  }
  localStorage.setItem(taskStorageKey,JSON.stringify(progress));setStorageError(false);
 }catch{setStorageError(true);}},[progress]);
 return {progress,setProgress,storageError};
}
function taskInstruction(item:typeof petTasks[number]){
 const descriptions:Record<string,string>={
  'body-shaking':'Дождитесь первого естественного отряхивания всем телом после пробуждения.',
  sleeping:'Дождитесь, когда питомец естественно уснёт днём.',
  eating:'Дайте обычную порцию корма в привычной миске.',
  drinking:'Дождитесь, когда питомец сделает несколько глотков воды.',
  'head-shaking':'Дождитесь естественного быстрого движения головой.',
 };
 return descriptions[item.id]||item.description.replace(' Сразу после действия нажмите кнопку готово.','');
}
function PetTasks({state}:{state:ReturnType<typeof usePetTasks>}){
 const {progress,setProgress,storageError}=state;
 const [view,setView]=useState<'list'|'detail'|'feedback'|null>(null);
 const [selected,setSelected]=useState(petTasks[0].id);
 const [expandedTask,setExpandedTask]=useState<string|null>(null);
 const railRoot=useRef<HTMLDivElement>(null);
 const [railIndex,setRailIndex]=useState(0);
 const [swipeHint,setSwipeHint]=useState(()=>{try{return localStorage.getItem('whoof-task-swipe-seen')!=='1';}catch{return true;}});
 useEffect(()=>{if(railIndex===0)return;setSwipeHint(false);try{localStorage.setItem('whoof-task-swipe-seen','1');}catch{}},[railIndex]);
 const [outcome,setOutcome]=useState<TaskOutcome|null>(null),[note,setNote]=useState('');
 const [now,setNow]=useState(Date.now()),[notice,setNotice]=useState('');
 const keyboard=useKeyboard();
 const today=dateKey(new Date(now));
 const completed=(id:string)=>progress.results[id]?.outcome==='yes'&&dateKey(new Date(progress.results[id].markedAt))===today;
 const done=dailyTasks.filter(t=>completed(t.id)).length;
 const totalDone=petTasks.filter(t=>completed(t.id)).length;
 const allDone=done===dailyTasks.length;
 const orderedDaily=[...dailyTasks].sort((a,b)=>{
  const aDone=completed(a.id),bDone=completed(b.id);
  if(aDone!==bDone)return aDone?1:-1;
  return aDone?progress.results[a.id].markedAt-progress.results[b.id].markedAt:0;
 });
 const railOrder=orderedDaily.map(t=>`${t.id}:${completed(t.id)}`).join('|');
 useEffect(()=>{
  const rail=railRoot.current?.querySelector<HTMLElement>('.daily-task-carousel');if(!rail)return;
  const slots=Array.from(rail.querySelectorAll<HTMLElement>('.task-slide'));
  const surfaces=slots.map(slot=>slot.querySelector<HTMLElement>('.task-slide-surface')!);
  let frame=0,centers:number[]=[],stride=1,viewportWidth=0,lastIndex=-1;
  const paint=()=>{
   frame=0;
   const center=rail.scrollLeft+viewportWidth/2;
   let closest=0,distance=Infinity;
   // Geometry is measured only on resize. Writes animate inner surfaces, not snap targets.
   centers.forEach((position,i)=>{
    const delta=(position-center)/stride;
    const depth=Math.min(1,Math.abs(delta)),direction=Math.max(-1,Math.min(1,delta));
    surfaces[i].style.transform=`translate3d(${-direction*36}px,0,0) scale(${1-depth*.15})`;
    slots[i].style.zIndex=String(Math.round(10-depth*5));
    if(Math.abs(delta)<distance){distance=Math.abs(delta);closest=i;}
   });
   if(closest!==lastIndex){lastIndex=closest;setRailIndex(closest);}
  };
  const sync=()=>{if(!frame)frame=requestAnimationFrame(paint);};
  const measure=()=>{
   viewportWidth=rail.clientWidth;
   rail.style.setProperty('--task-card-width',`${viewportWidth-72}px`);
   centers=slots.map(slot=>slot.offsetLeft+slot.offsetWidth/2);
   stride=centers.length>1?centers[1]-centers[0]:viewportWidth;
   rail.scrollTo({left:Math.max(0,(centers[Math.max(0,lastIndex)]||viewportWidth/2)-viewportWidth/2),behavior:'instant'});
   sync();
  };
  rail.addEventListener('scroll',sync,{passive:true});
  const resize=new ResizeObserver(measure);resize.observe(rail);measure();
  return()=>{cancelAnimationFrame(frame);rail.removeEventListener('scroll',sync);resize.disconnect();};
 },[railOrder,allDone]);

 const task=petTasks.find(t=>t.id===selected)!;
 const activeTask=petTasks.find(t=>t.id===progress.active?.id);
 const elapsed=progress.active?Math.max(0,Math.floor((now-progress.active.started)/1000)):0;
 const clock=`${String(Math.floor(elapsed/60)).padStart(2,'0')}:${String(elapsed%60).padStart(2,'0')}`;
 useEffect(()=>{setNow(Date.now());const id=setInterval(()=>setNow(Date.now()),progress.active?1000:30000);return()=>clearInterval(id);},[progress.active]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>{setNotice('');},6000);return()=>clearTimeout(timer);},[notice]);
 function close(){keyboard.hide();setView(null);}
 function markDone(item:typeof petTasks[number]){
  const markedAt=Date.now();keyboard.hide();setNow(markedAt);
  setProgress(p=>({results:{...p.results,[item.id]:{outcome:'yes',note:'',markedAt,...(p.active?.id===item.id?{startedAt:p.active.started}:{})}},active:p.active?.id===item.id?null:p.active}));
  setNotice('');
 }
 function undoCompletion(item:typeof petTasks[number]){
  keyboard.hide();
  setProgress(p=>{const results={...p.results};delete results[item.id];return {...p,results};});
  setNotice('Отметка о выполнении отменена');
 }
 function taskAction(item:typeof petTasks[number]){
  if(completed(item.id))return;
  if(item.mode==='Interval'&&progress.active?.id!==item.id){
   if(progress.active)return;
   const started=Date.now();setNotice('');setNow(started);setProgress(p=>({...p,active:{id:item.id,started}}));
  }else markDone(item);
 }
 function feedback(item:typeof petTasks[number]){
  keyboard.hide();setSelected(item.id);setOutcome(progress.results[item.id]?.outcome||'no');setNote(progress.results[item.id]?.note||'');setView('feedback');
 }
 function save(){
  if(!outcome)return;keyboard.hide();const markedAt=Date.now();setNow(markedAt);
  setProgress(p=>({results:{...p.results,[task.id]:{...p.results[task.id],outcome,note:note.trim(),markedAt:p.results[task.id]?.markedAt&&dateKey(new Date(p.results[task.id].markedAt))===dateKey(new Date(markedAt))?p.results[task.id].markedAt:markedAt,...(p.active?.id===task.id?{startedAt:p.active.started}:{})}},active:p.active?.id===task.id?null:p.active}));
  setNotice('Обратная связь сохранена');setView('list');
 }
 function taskDetails(item:typeof petTasks[number],prefix:string){
  const result=progress.results[item.id];
  return <div className="task-expanded-body" id={`${prefix}-details-${item.id}`}>
   <p className="task-expanded-instruction">{taskInstruction(item)}</p><p className="task-expanded-why">{item.why}</p>
   {!completed(item.id)&&<p className="task-action-hint">{item.hint}</p>}
   {result?.note&&<p className="task-feedback-note">Ваш комментарий: {result.note}</p>}
   {progress.active?.id===item.id&&<button className="text-button task-back" onClick={()=>{setProgress(p=>({...p,active:null}));setNotice('Задание отложено');}}>Отложить задание</button>}
   <button className="text-button task-back" onClick={()=>feedback(item)}>{completed(item.id)?'Добавить комментарий':'Не получилось выполнить'}</button>
   {prefix==='catalog'&&completed(item.id)&&<button className="text-button task-undo" onClick={()=>undoCompletion(item)}>Отменить выполнение</button>}
  </div>;
 }
 function quickAction(item:typeof petTasks[number],compact=false){
  const checked=completed(item.id),active=progress.active?.id===item.id;
  const blocked=item.mode==='Interval'&&!!progress.active&&!active;
  if(checked)return <span className="task-quick-action is-done task-completion">{compact&&<Check size={15}/>}Выполнено</span>;
  const label=active?'Готово':item.mode==='Interval'?'Начать':'Готово';
  return <button className={`task-quick-action ${active?'is-running':''}`} aria-label={`${label}: ${item.title}`} disabled={blocked} title={blocked?`Сначала завершите: ${activeTask?.title}`:undefined} onClick={()=>taskAction(item)}>{label}{compact&&(item.mode==='Interval'&&!active?<Play size={12} weight="fill"/>:<span className="task-action-circle" aria-hidden="true"/>)}</button>;
 }
 function completionNotice(){return notice&&<div className="task-inline-notice" role="status"><span>{notice}</span></div>;}
 return <section className="pet-tasks-section" aria-labelledby="pet-tasks-heading">
  <div className="pet-tasks-heading task-rail-heading"><h2 id="pet-tasks-heading">Задания на сегодня</h2><span className="task-rail-count">{done} из {dailyTasks.length}</span></div>
  <div className="task-rail-section" ref={railRoot}>
   {allDone?<div className="tasks-celebration" role="status"><span className="tasks-celebration-icon"><Check size={23} weight="bold"/></span><div><h3>Ура, все задания на сегодня выполнены!</h3><p>Спасибо, что помогаете нам лучше узнать питомца.</p></div></div>:<><Carousel centered className="daily-task-carousel" contentClassName="daily-task-track" ariaLabel="Задания на сегодня — листайте по горизонтали">{orderedDaily.map(item=>{
    const checked=completed(item.id),active=progress.active?.id===item.id;
    return <article className="task-slide" key={item.id} data-task-id={item.id}><div className={`task-slide-surface friendly-task-card task-color-${item.tone} ${checked?'is-done':''}`}>
     <button className="task-slide-open" aria-label={`Подробнее: ${item.title}`} aria-haspopup="dialog" onClick={()=>{keyboard.hide();setSelected(item.id);setView('detail');}}>
      <span className="task-slide-top"><AccentIcon icon={item.Icon} tone={item.tone}/><span className="task-slide-context">{item.context}</span><span className="task-card-state"><CaretRight size={14}/></span></span>
      <strong>{item.title}</strong><small>{active?`В процессе · ${clock}`:item.duration}</small>
     </button>
     {quickAction(item)}
    </div></article>;
   })}</Carousel>
   <div className="task-rail-pagination"><span aria-hidden="true" className="task-rail-dots">{orderedDaily.map((item,i)=><i key={item.id} className={i===railIndex?'current':''}/>)}</span>{swipeHint&&<span>Листайте задания</span>}</div></>}
   {activeTask&&!dailyTaskIds.includes(activeTask.id)&&<button className="task-running-link" onClick={()=>{setExpandedTask(activeTask.id);setView('list');}}>В процессе: {activeTask.title} · {clock}<CaretRight size={14}/></button>}
   <button className="task-all-link" onClick={()=>{keyboard.hide();setView('list');}}>Посмотреть все задания<span>{petTasks.length}<CaretRight size={15}/></span></button>
  </div>
  <BottomSheet open={view!==null} onOpenChange={open=>{if(!open)close();}} title={view==='feedback'?'Как всё прошло?':view==='detail'?task.title:'Все задания'} snap={.92}>
   <div className="sheet-body pet-task-sheet"><button className="sheet-close icon-button" aria-label="Закрыть задания" onClick={close}><X size={19}/></button>
    {view==='detail'?<>
     <div className="task-detail-hero"><AccentIcon icon={task.Icon} tone={task.tone}/><div><span>{task.context}</span><p><Clock size={14}/>{task.duration}</p></div></div>
     {progress.active?.id===task.id&&<div className="task-detail-status"><span><span className="task-live-dot"/>Задание в процессе</span><strong>{clock}</strong></div>}
     {taskDetails(task,'detail')}
     <div className="task-detail-action">{quickAction(task)}</div>
     {completionNotice()}
    </>:view==='feedback'?<>
     <p className="task-sheet-intro">{task.title}. Удалось выполнить задание так, как описано?</p>
     <fieldset className="task-outcomes"><legend className="task-sr-only">Результат задания</legend>{(['yes','partly','no'] as TaskOutcome[]).map(value=><label key={value}><input type="radio" name="task-outcome" value={value} checked={outcome===value} onChange={()=>setOutcome(value)}/><span>{taskOutcomeLabels[value]}</span></label>)}</fieldset>
     <label className="task-comment">Что заметили? <span>Необязательно</span><KeyboardTextarea placeholder="Расскажите, как всё прошло" value={note} maxLength={1000} onChange={e=>setNote(e.target.value)}/></label>
     <button className="primary full" disabled={!outcome} onClick={save}>Сохранить результат</button>
     <button className="text-button task-back" onClick={()=>{keyboard.hide();setExpandedTask(task.id);setView('list');}}>Вернуться к заданиям</button>
    </>:<>
     <p className="task-sheet-intro">Дома, на прогулке или во время отдыха — выберите подходящий момент. Любое задание можно раскрыть.</p>
     <div className="task-catalog-summary"><span>{petTasks.length} заданий на выбор</span><span>{totalDone} выполнено сегодня</span></div>
     {activeTask&&<div className="task-catalog-active"><Clock size={16}/><span>{activeTask.title}</span><strong>{clock}</strong></div>}
     {completionNotice()}
     <div className="pet-task-list">{petTasks.map(item=>{
      const active=progress.active?.id===item.id,expanded=expandedTask===item.id;
      return <article key={item.id} className={`friendly-task-card task-color-${item.tone}`}>
       <div className="task-catalog-row"><button className="friendly-task-toggle" aria-expanded={expanded} aria-controls={`catalog-details-${item.id}`} onClick={()=>setExpandedTask(expanded?null:item.id)}><AccentIcon icon={item.Icon} tone={item.tone}/><span className="friendly-task-copy"><strong>{item.title}</strong><span>{active?`В процессе · ${clock}`:item.duration}</span><small className="task-details-link">Подробнее <CaretDown size={12}/></small></span></button>{quickAction(item,true)}</div>
       {expanded&&taskDetails(item,'catalog')}
      </article>;
     })}</div>
    </>}
    <p className="task-local-note">{storageError?'Не удалось сохранить отметки в браузере. Они доступны до закрытия приложения.':'Отметки сохраняются только в этом браузере.'}</p>
   </div>
  </BottomSheet>
 </section>;
}

type FriendWalkStage='invited'|'walking'|'finished';
function IOSFriendNotification({enabled,scheduledAt,petName,onOpen}:{enabled:boolean;scheduledAt:number|null;petName:string;onOpen:()=>void}){
 const [visible,setVisible]=useState(false),[interacting,setInteracting]=useState(false);
 const delivered=useRef(false),dragged=useRef(false);
 const reducedMotion=useReducedMotion();
 useEffect(()=>{
  if(!enabled||scheduledAt===null){setVisible(false);return;}
  if(delivered.current)return;
  const timer=setTimeout(()=>{delivered.current=true;setVisible(true);},Math.max(0,scheduledAt-Date.now()));
  return()=>clearTimeout(timer);
 },[enabled,scheduledAt]);
 useEffect(()=>{
  if(!visible||interacting)return;
  const timer=setTimeout(()=>setVisible(false),9000);
  return()=>clearTimeout(timer);
 },[visible,interacting]);
 useEffect(()=>{
  if(!visible)return;
  const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setVisible(false);};
  document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close);
 },[visible]);
 return <AnimatePresence initial={false}>{visible&&<motion.aside className="ios-notification" aria-label="Уведомление Whoof" initial={{y:reducedMotion?0:'-150%',opacity:0}} animate={{y:0,opacity:1}} exit={{y:reducedMotion?0:'-150%',opacity:0}} transition={{type:'spring',duration:reducedMotion?0:.45,bounce:0}} drag="y" dragConstraints={{top:-180,bottom:0}} dragElastic={0} dragSnapToOrigin dragTransition={{bounceStiffness:600,bounceDamping:40}}
  onPointerDownCapture={()=>{dragged.current=false;}}
  onDragStart={()=>{dragged.current=true;setInteracting(true);}}
  onDragEnd={(_,info)=>{setInteracting(false);if(info.offset.y<-40||info.velocity.y<-400)setVisible(false);}}
  onMouseEnter={()=>setInteracting(true)} onMouseLeave={()=>setInteracting(false)}
  onFocusCapture={()=>setInteracting(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setInteracting(false);}}>
  <button className="ios-notification-open" onClick={()=>{if(dragged.current)return;setVisible(false);onOpen();}} aria-label={`Открыть приглашение: Боня собирается в парк`}>
   <span className="ios-notification-icon" aria-hidden="true"><PawPrint size={24} weight="fill"/></span>
   <span className="ios-notification-copy" role="status"><span className="ios-notification-app">WHOOF <span>сейчас</span></span><strong>А {petName} сегодня выйдет гулять?</strong><span>Боня собирается в парк. Присоединитесь?</span></span>
  </button>
  <button className="ios-notification-close" aria-label="Скрыть уведомление" onClick={()=>setVisible(false)}><X size={14}/></button>
  <span className="ios-notification-handle" aria-hidden="true"/>
 </motion.aside>}</AnimatePresence>;
}
const FRIEND_WALK_PHOTO=import.meta.env.BASE_URL+'assets/whoof/friends-walk.png';
function FriendWalkMap({finished=false}:{finished?:boolean}){
 return <div className="friend-route"><svg viewBox="220 280 710 660" role="img" aria-label={finished?'Совместный маршрут по парку, 2,4 километра':'Место встречи у круглой площадки в парке'}>
  <image href={MAP} width="1254" height="1254"/>
  {finished&&<path className="friend-route-line" d="M514 438 C565 430 607 426 640 443 S706 481 716 532 S752 613 808 612 C730 613 652 630 616 668 S613 716 576 697 S518 638 492 610 S456 585 433 582 L316 535 C306 496 302 427 330 396 S402 370 436 354 C441 379 477 384 487 406 L514 438"/>}
  <circle cx="514" cy="438" r="17" fill="white"/><circle cx="514" cy="438" r="10" fill="#648ce4"/>
 </svg><span><MapPin size={14}/>{finished?'Ваш маршрут вместе':'Встреча у круглой площадки'}</span></div>;
}
function FriendWalkNotice({stage,petName,petPhoto,onJoin,onOpen,onDismiss,blocked=false}:{stage:FriendWalkStage;petName:string;petPhoto:string;onJoin:()=>void;onOpen:()=>void;onDismiss?:()=>void;blocked?:boolean}){
 return <article className={`friend-notice friend-notice-${stage}`} aria-label="Прогулка с Боней">
  <div className="friend-notice-top"><span className="friend-avatar-pair"><img src={petPhoto} alt=""/><span><PawPrint size={19} weight="fill"/></span></span><span>{stage==='invited'?'Приглашение · сейчас':stage==='walking'?'Вы гуляете вместе':'Хороший день для дружбы'}</span>{onDismiss&&<button className="icon-button" aria-label="Скрыть приглашение" onClick={onDismiss}><X size={17}/></button>}</div>
  <h2>{stage==='invited'?`А ${petName} сегодня выйдет гулять?`:stage==='walking'?`${petName} и Боня — на прогулке`:'Ещё одна прогулка вместе'}</h2>
  <p>{stage==='invited'?'Боня собирается в парк. Присоединитесь?':stage==='walking'?'Боня и Анна ждут у круглой площадки. Хорошей прогулки!':'42 минуты, 2,4 км и новое общее воспоминание.'}</p>
  {stage==='finished'&&<img className="friend-memory-preview" src={FRIEND_WALK_PHOTO} alt={`${petName} и Боня в парке`}/>}
  <button className={stage==='invited'?'primary full':'secondary full'} disabled={stage==='invited'&&blocked} onClick={stage==='invited'?onJoin:onOpen}>{stage==='invited'?'Присоединиться':stage==='walking'?'К общей прогулке':'Посмотреть карточку'}{stage!=='invited'&&<CaretRight size={17}/>}</button>
  {stage==='invited'&&blocked&&<p className="friend-hint">Сначала завершите текущую прогулку.</p>}
 </article>;
}
function FriendWalkMemory({petName}:{petName:string}){
 return <div className="friend-memory"><p className="friend-kicker">Сегодня · прогулка с друзьями</p><h2>{petName} + Боня</h2><p>Парк, любимая компания и время вместе.</p><img className="friend-memory-photo" src={FRIEND_WALK_PHOTO} alt={`${petName} и Боня после прогулки в парке`}/><div className="friend-memory-stats"><div><strong>42 <small>мин</small></strong><span>вместе</span></div><div><strong>2,4 <small>км</small></strong><span>прошли по парку</span></div></div><FriendWalkMap finished/><div className="friend-memory-caption"><Heart size={20} weight="fill"/><p>Дружба складывается<br/>из таких прогулок.</p></div></div>;
}

type PreviewAccount={email:string;provider:'email'|'yandex'};
const PREVIEW_SESSION_KEY='whoof.preview-session.v1';
function readPreviewSession():PreviewAccount|null{
 try{
  const saved=JSON.parse(localStorage.getItem(PREVIEW_SESSION_KEY)||'null');
  if(saved&&typeof saved.email==='string'&&saved.email.trim()&&(saved.provider==='email'||saved.provider==='yandex'))return {email:saved.email,provider:saved.provider};
 }catch{/* Storage may be unavailable or contain an old/broken preview value. */}
 return null;
}
// In-memory fixtures only. Passwords are never persisted or sent over the network.
const previewAccounts=new Map<string,string>([['demo@whoof.app','Whoof2026!']]);
const passwordRules=[
 {label:'Не менее 8 символов',test:(value:string)=>Array.from(value).length>=8},
 {label:'Строчная буква',test:(value:string)=>/\p{Ll}/u.test(value)},
 {label:'Заглавная буква',test:(value:string)=>/\p{Lu}/u.test(value)},
 {label:'Цифра',test:(value:string)=>/\d/.test(value)},
 {label:'Спецсимвол, например ! @ #',test:(value:string)=>/[\p{P}\p{S}]/u.test(value)},
];
function AuthPreview({onEnter}:{onEnter:(account:PreviewAccount)=>void}){
 const [mode,setMode]=useState<'welcome'|'login'|'register'>('welcome');
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[visible,setVisible]=useState(false);
 const [submitted,setSubmitted]=useState(false),[error,setError]=useState(''),[alternative,setAlternative]=useState<'login'|'register'|null>(null);
 const [sheet,setSheet]=useState<'yandex'|'reset'|null>(null);
 const keyboard=useKeyboard();
 const emailValid=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
 const rulesValid=passwordRules.every(rule=>rule.test(password));
 const register=mode==='register';
 function switchMode(next:'welcome'|'login'|'register'){
  keyboard.hide();setMode(next);setPassword('');setVisible(false);setSubmitted(false);setError('');setAlternative(null);
 }
 function submit(event:React.FormEvent){
  event.preventDefault();setSubmitted(true);setError('');setAlternative(null);
  if(!emailValid){document.getElementById('auth-email')?.focus();return;}
  if(!password||(register&&!rulesValid)){document.getElementById('auth-password')?.focus();return;}
  const address=email.trim().toLowerCase(),existing=previewAccounts.get(address);
  if(register&&existing!==undefined){setError('Аккаунт с этой почтой уже есть. Войдите в него.');setAlternative('login');return;}
  if(!register&&existing===undefined){setError('В прототипе пока нет аккаунта с этой почтой. Давайте создадим его.');setAlternative('register');return;}
  if(!register&&existing!==password){setError('Неверный пароль. Попробуйте ещё раз.');return;}
  if(register)previewAccounts.set(address,password);
  keyboard.hide();onEnter({email:address,provider:'email'});
 }
 function fillDemo(){setEmail('demo@whoof.app');setPassword('Whoof2026!');setSubmitted(false);setError('');setAlternative(null);}
 if(mode==='welcome')return <div className="whoof-app auth-app"><MobileScroll className="auth-screen auth-welcome-screen"><main className="whoof-content auth-content auth-welcome">
  <header className="auth-welcome-brand"><img src={import.meta.env.BASE_URL+'assets/whoof/logo.svg'} alt="Whoof" width="194" height="111" draggable={false}/></header>
  {/* Reserved for the user's artwork; replace this surface with the supplied image. */}
  <div className="auth-artwork-slot" aria-hidden="true"/>
  <div className="auth-welcome-bottom">
   <div className="auth-heading"><h1>Ближе к питомцу</h1><p>Узнавайте, как проходит его день,<br/>и замечайте важное вместе с Whoof.</p></div>
   <div className="auth-welcome-actions"><button className="primary full" onClick={()=>switchMode('register')}>Создать аккаунт</button><button className="secondary full" onClick={()=>switchMode('login')}>Войти</button></div>
  </div>
 </main></MobileScroll></div>;
 return <div className="whoof-app auth-app"><MobileScroll key={mode} className="auth-screen"><main className="whoof-content auth-content auth-credentials">
  <header className="auth-form-header"><button className="icon-button" aria-label="Назад к приветствию" onClick={()=>switchMode('welcome')}><ArrowLeft size={22}/></button><span className="wordmark">whoof</span></header>
  <div className="auth-heading"><h1>{register?'Давайте знакомиться':'С возвращением'}</h1><p>{register?'Создайте аккаунт, чтобы быть ближе к тому, кого любите.':'Войдите, чтобы узнать, как прошёл день вашего питомца.'}</p></div>
  <form className="auth-form" noValidate onSubmit={submit}>
   <div className="auth-field"><label htmlFor="auth-email">Электронная почта</label><KeyboardInput id="auth-email" type="email" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false} value={email} onChange={e=>{setEmail(e.target.value);setError('');setAlternative(null);}} placeholder="you@example.com" required aria-invalid={submitted&&!emailValid} aria-describedby={submitted&&!emailValid?'auth-email-error':undefined}/>{submitted&&!emailValid&&<p className="auth-error" id="auth-email-error">Введите почту в формате name@example.com.</p>}</div>
   <div className="auth-field"><label htmlFor="auth-password">Пароль</label><div className="auth-password"><KeyboardInput id="auth-password" type={visible?'text':'password'} autoComplete={register?'new-password':'current-password'} autoCapitalize="none" spellCheck={false} value={password} onChange={e=>{setPassword(e.target.value);setError('');setAlternative(null);}} placeholder={register?'Придумайте пароль':'Введите пароль'} required aria-invalid={submitted&&(!password||(register&&!rulesValid))} aria-describedby={register?'password-requirements':submitted&&!password?'auth-password-error':undefined}/><button type="button" className="auth-show-password" aria-label={visible?'Скрыть пароль':'Показать пароль'} aria-pressed={visible} onPointerDown={e=>e.preventDefault()} onClick={()=>setVisible(value=>!value)}>{visible?<EyeSlash size={21}/>:<Eye size={21}/>}</button></div>
    {!register&&submitted&&!password&&<p className="auth-error" id="auth-password-error">Введите пароль.</p>}
   </div>
   {register?<ul id="password-requirements" className={`password-requirements ${submitted?'was-submitted':''}`} aria-label="Требования к паролю">{passwordRules.map(rule=><li key={rule.label} className={rule.test(password)?'is-met':''}>{rule.test(password)?<Check size={14} weight="bold" aria-hidden="true"/>:<span className="password-rule-dot" aria-hidden="true"/>}<span>{rule.label}</span><span className="task-sr-only">{rule.test(password)?' — выполнено':' — не выполнено'}</span></li>)}</ul>:<button type="button" className="auth-forgot" onClick={()=>{keyboard.hide();setSheet('reset');}}>Забыли пароль?</button>}
   {error&&<div className="auth-error-box" role="alert"><p>{error}</p>{alternative&&<button type="button" onClick={()=>switchMode(alternative)}>{alternative==='login'?'Войти в аккаунт':'Зарегистрироваться'}<ArrowUp size={15}/></button>}</div>}
   <button className="primary full auth-submit" type="submit">{register?'Создать аккаунт':'Войти'}</button>
  </form>
  <div className="auth-divider"><span>или</span></div>
  <button className="secondary full auth-yandex" onClick={()=>{keyboard.hide();setSheet('yandex');}}><span className="yandex-mark" aria-hidden="true">Я</span>{register?'Продолжить с Яндекс ID':'Войти с Яндекс ID'}</button>
  <p className="auth-switch">{register?'Уже есть аккаунт?':'Нет аккаунта?'} <button onClick={()=>switchMode(register?'login':'register')}>{register?'Войти':'Зарегистрироваться'}</button></p>
  <aside className="auth-preview-note"><p>Прототип · используйте тестовые данные.<br/>Вход запоминается в этом браузере. Пароль не сохраняется.</p>{!register&&<button onClick={fillDemo}>Заполнить тестовые данные<ArrowUp size={13}/></button>}</aside>
 </main></MobileScroll>
 <BottomSheet open={sheet!==null} onOpenChange={value=>{if(!value)setSheet(null);}} title={sheet==='yandex'?'Вход с Яндекс ID':'Восстановление пароля'} snap={.7}><div className="sheet-body auth-provider-sheet"><button className="sheet-close icon-button" aria-label="Закрыть окно входа" onClick={()=>setSheet(null)}><X size={19}/></button>
  {sheet==='yandex'?<><span className="yandex-mark auth-provider-mark" aria-hidden="true">Я</span><h2>Один аккаунт для Whoof</h2><p className="intro small">В готовом приложении здесь откроется Яндекс: вы выберете аккаунт и разрешите вход в Whoof.</p><div className="quiet-card"><Info size={20}/><p>Сейчас это предпросмотр сценария. Подключения к Яндексу и передачи данных нет.</p></div><button className="primary full" onClick={()=>{keyboard.hide();onEnter({email:'Яндекс ID · тестовый аккаунт',provider:'yandex'});}}>Продолжить в прототипе</button></>:<><p className="intro small">В готовом приложении вы сможете получить ссылку для восстановления на свою почту.</p><div className="quiet-card"><Info size={20}/><p>В прототипе письма не отправляются. Можно войти с тестовым аккаунтом.</p></div><button className="primary full" onClick={()=>{setSheet(null);fillDemo();}}>Использовать тестовый аккаунт</button></>}
 </div></BottomSheet></div>;
}
// Authentication is temporarily disabled for the shared clickable prototype.
// Keep AuthPreview available for a future iteration, without exposing an entry point.
export default function WhoofPreview(){
 return <Whoof/>;
}

// Annual recap uses the supplied demo copy, independently of live daily fixtures.
const annualStories=[
 {title:'Вокруг света почти получилось',metric:'826',unit:'км',body:'За год вы прошли 826 км. Это почти 0.5% пути вокруг Земли — и всё ради новых кустов.',label:'Ваш год в движении'},
 {title:'Карта приключений',metric:'65',unit:'маршрутов',body:'За год вы открыли 65 новых маршрутов. Кажется, пора выпускать собственный путеводитель.',label:'Маршруты года'},
 {title:'Месяц больших планов',metric:'Март',unit:'2026',body:'В марте вы открыли 19 маршрутов, встретили 6 друзей и гуляли 35 часов. Дома почти не появлялись.',label:'Месяц года'},
 {title:'Инспектор кустов года',metric:'16',unit:'часов',body:'Джесси обнюхивал землю 16 часов. Ни одна важная улика не осталась незамеченной.',label:'Ароматы года'},
 {title:'Собачья социальная сеть',metric:'27',unit:'прогулок',body:'За год состоялось 27 совместных прогулок с 6 друзьями. Никаких переписок — только личные встречи.',label:'Друзья года'},
 {title:'Организатор тусовок',metric:'19',unit:'приглашений',body:'Вы отправили 19 приглашений на прогулку. Похоже, Джека стал главным организатором встреч.',label:'Приглашения года'},
 {title:'Главный спутник приключений',metric:'+12',unit:'минут',body:'Вместе с Джесси прогулки длились в среднем на 12 минут дольше. В хорошей компании домой можно не торопиться.',label:'Вместе веселее'},
 {title:'Главный жанр года',metric:'Скуление',unit:'',body:'В репертуаре преобладало скуление. Остальные жанры выходили ограниченным тиражом.',label:'Звук года'},
 {title:'День внутреннего волка',metric:'22',unit:'ноября',body:'22 ноября Джека выл чаще всего. Корни напомнили о себе.',label:'Самый громкий день'},
 {title:'Разговорчивый, но спокойный',metric:'7%',unit:'эпизодов',body:'Джесси много лаял, но только 7% эпизодов относились к высокому уровню голосового возбуждения.',label:'Голосовая активность'},
 {title:'Тихий сосед года',metric:'114',unit:'ночей',body:'114 ночей прошли без единого эпизода лая. Соседи поставили пять звёзд.',label:'Спокойные ночи'},
 {title:'Любимое время года',metric:'Лето',unit:'2026',body:'Летом 2026 года Джесси был счастливее всего. Больше прогулок, новых запахов и поводов вилять хвостом.',label:'Сезон года'},
 {title:'Стал выносливее',metric:'−7',unit:'минут',body:'К декабрю Джека восстанавливался после нагрузки на 7 минут быстрее. Год приключений явно пошёл на пользу.',label:'Восстановление к декабрю'},
];
function AnnualRecap({open,onOpenChange}:{open:boolean;onOpenChange:(value:boolean)=>void}){
 const [index,setIndex]=useState(-1),[paused,setPaused]=useState(false),[held,setHeld]=useState(false),[hidden,setHidden]=useState(false),[ready,setReady]=useState(false);
 const reduced=useReducedMotion();
 const elapsed=useRef(0),progress=useRef<HTMLSpanElement>(null);
 const gesture=useRef<{x:number;y:number;time:number}|null>(null);
 const story=annualStories[index];
 const dark=index>=7&&index<=10;
 const background=index>=2?`${import.meta.env.BASE_URL}assets/recap/${index+1}.jpg`:null;
 const advance=()=>{if(index===12)onOpenChange(false);else setIndex(i=>i+1);};
 useEffect(()=>{if(open){setIndex(-1);setPaused(false);setHeld(false);}},[open]);
 useEffect(()=>{const update=()=>setHidden(document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
 useEffect(()=>{elapsed.current=0;setReady(!background);if(progress.current)progress.current.style.transform='scaleX(0)';
  if(background){const img=new Image();img.src=background;let active=true;const done=()=>{if(active)setReady(true);};img.onload=done;img.onerror=done;if(img.complete)done();return()=>{active=false;};}
 },[index,background,open]);
 useEffect(()=>{if(!open)return;const next=index+2;if(next>=3&&next<=13){const img=new Image();img.src=`${import.meta.env.BASE_URL}assets/recap/${next}.jpg`;}},[index,open]);
 useEffect(()=>{if(!open||paused||held||hidden||!ready||reduced)return;let id=0,previous=performance.now();const duration=index===-1?5500:10000;
  const tick=(now:number)=>{elapsed.current+=Math.min(now-previous,100);previous=now;if(progress.current)progress.current.style.transform=`scaleX(${Math.min(1,elapsed.current/duration)})`;if(elapsed.current>=duration){if(index===12)onOpenChange(false);else setIndex(i=>i+1);return;}id=requestAnimationFrame(tick);};id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);
 },[index,open,paused,held,hidden,ready,reduced,onOpenChange]);
 const back=()=>setIndex(i=>Math.max(-1,i-1));
 return <RecapDialog.Root open={open} onOpenChange={onOpenChange}>
  <RecapDialog.Trigger asChild><button className="recap-entry" onClick={()=>{if(document.activeElement instanceof HTMLElement)document.activeElement.blur();}}><span className="recap-entry-eyebrow"><AccentIcon icon={Sparkle} tone="purple"/>ИТОГИ 2026</span><strong>Ваш год с Джекой</strong><span className="recap-entry-bottom"><span>826 км, 65 новых маршрутов<br/>и ещё 11 открытий</span><span className="recap-entry-cta">Смотреть итоги<CaretRight size={14}/></span></span><svg className="recap-entry-route" viewBox="0 0 250 100" aria-hidden="true"><path d="M0 90C70 110 50 0 130 45S190 70 250 0"/><circle cx="130" cy="45" r="5"/></svg></button></RecapDialog.Trigger>
  <RecapDialog.Portal><RecapDialog.Overlay className="recap-overlay"/><RecapDialog.Content className={`recap-view ${dark?'recap-dark':''} recap-at-${index+1} ${(paused||held)?'recap-paused':''}`} aria-describedby={undefined} onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();advance();}if(e.key==='ArrowLeft'){e.preventDefault();back();}if(e.code==='Space'&&e.target===e.currentTarget){e.preventDefault();setPaused(p=>!p);}}}>
   <RecapDialog.Title className="recap-sr">Итоги 2026</RecapDialog.Title>
   <div className="recap-progress" aria-label={index<0?'Обложка':`История ${index+1} из 13`}>{annualStories.map((s,i)=><button key={s.title} aria-label={`История ${i+1}: ${s.title}`} aria-current={i===index?'step':undefined} onClick={()=>setIndex(i)}><span style={{transform:`scaleX(${i<index?1:0})`}} ref={i===index?progress:undefined}/></button>)}</div>
   <div className="recap-toolbar"><span>WHOOF <i>·</i> 2026</span><div><button aria-label={paused?'Продолжить итоги':'Приостановить итоги'} onClick={()=>setPaused(p=>!p)}>{paused?<Play size={18} weight="fill"/>:<Pause size={18} weight="fill"/>}</button><RecapDialog.Close aria-label="Закрыть итоги"><X size={22}/></RecapDialog.Close></div></div>
   <div className="recap-stage" onPointerDown={e=>{if(e.button!==0)return;gesture.current={x:e.clientX,y:e.clientY,time:performance.now()};setHeld(true);e.currentTarget.setPointerCapture(e.pointerId);}} onPointerCancel={()=>{gesture.current=null;setHeld(false);}} onLostPointerCapture={()=>{gesture.current=null;setHeld(false);}} onPointerUp={e=>{const start=gesture.current;gesture.current=null;setHeld(false);if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.abs(dy)>80&&Math.abs(dy)>Math.abs(dx)){if(dy>0)onOpenChange(false);return;}if(Math.abs(dx)>45){dx<0?advance():back();return;}if(performance.now()-start.time<280){const bounds=e.currentTarget.getBoundingClientRect();e.clientX-bounds.left<bounds.width*.3?back():advance();}}}>
    <AnimatePresence mode="wait"><motion.div key={index} className="recap-scene" initial={{opacity:0,x:reduced?0:16}} animate={{opacity:1,x:0}} exit={{opacity:0,x:reduced?0:-12}} transition={{duration:reduced?.1:.25}}>
     {background&&<img className="recap-background" src={background} alt="" draggable={false}/>}
     {index<2&&<div className={`recap-original-art recap-art-${index}`}><div className="recap-orbit"/><svg viewBox="0 0 400 420" aria-hidden="true"><path d="M-20 320C100 450 350 380 360 220S120 100 100 230S400 250 420 80"/>{[ [100,230],[360,220],[230,365],[320,132] ].map(([x,y])=><circle key={x} cx={x} cy={y} r="7"/>)}</svg><img src={index===1?MAP:DOG} alt=""/></div>}
     <div className="recap-readability"/>
     <div className="recap-copy" aria-live="polite"><span className="recap-eyebrow">{story?.label??'ИТОГИ 2026'}</span><h2>{story?.title??'Год Джеки'}</h2>{story?<><div className={`recap-metric ${index===7?'recap-word':''}`}><span>{story.metric}</span><small>{story.unit}</small></div><p>{story.body}</p></>:<p>13 историй о прогулках, друзьях<br/>и важных собачьих делах</p>}</div>
    </motion.div></AnimatePresence>
   </div>
   <footer className="recap-footer"><button onClick={back} disabled={index===-1} aria-label="Предыдущая история"><CaretLeft size={20}/></button><span>{index<0?'Нажимайте, чтобы листать':`${String(index+1).padStart(2,'0')} / 13`}<small>{held?'На паузе':reduced?'Листайте стрелками':'Удерживайте, чтобы остановить'}</small></span><button onClick={advance} aria-label={index===12?'Завершить итоги':'Следующая история'}>{index===12?<Check size={20}/>:<CaretRight size={20}/>}</button></footer>
  </RecapDialog.Content></RecapDialog.Portal>
 </RecapDialog.Root>;
}

// A fixed, dated clinical-review fixture, separate from the live-day prototype.
// Counts are recognised approaches; no consumption volume is inferred.
const vetReadings=Array.from({length:56},(_,i)=>({date:moveDate('2026-08-04',i),active:i<35?100:i<42?[78,72,69,64,62,60,57][i-35]:[68,74,80,86,92,104,112,106,99,95,102,108,110,106][i-42],rest:i<35?12:i<42?14:12.5,food:i<35?3:i<42?2:3,water:i<35?7:i<42?5:7}));
type VetReading=typeof vetReadings[number];
const vetFields=[{key:'active',label:'Активность',unit:'мин',icon:Lightning,tone:'blue'},{key:'rest',label:'Отдых',unit:'ч',icon:Moon,tone:'purple'},{key:'food',label:'Еда',unit:'подх.',icon:ForkKnife,tone:'orange'},{key:'water',label:'Питьё',unit:'подх.',icon:Drop,tone:'cyan'}] as const;
const vetAverage=(rows:VetReading[],key:typeof vetFields[number]['key'])=>rows.length?Math.round(rows.reduce((s,r)=>s+r[key],0)/rows.length*10)/10:null;
const vetNumber=(n:number|null)=>n===null?'—':n.toLocaleString('ru-RU',{maximumFractionDigits:1});
function VetLine({rows,field,marker}:{rows:VetReading[];field:typeof vetFields[number];marker?:string}){
 const max=Math.max(1,...rows.map(r=>r[field.key]))*1.15;
 const x=(i:number)=>30+i*280/Math.max(1,rows.length-1),y=(v:number)=>112-v/max*90;
 const index=rows.findIndex(r=>r.date===marker);
 return <svg className={`vet-chart vet-chart-${field.tone}`} viewBox="0 0 330 145" role="img" aria-label={`${field.label}, ${field.unit} в день. ${rows.map(r=>`${dateLabel(r.date)}: ${r[field.key]}`).join('; ')}`}>
 {[0,.5,1].map(t=><g key={t}><line x1="30" x2="310" y1={y(max*t)} y2={y(max*t)} stroke="#e7e8ee"/><text x="3" y={y(max*t)+3}>{Math.round(max*t)}</text></g>)}
 {index>=0&&<g><line x1={x(index)} x2={x(index)} y1="10" y2="112" stroke="#aaa" strokeDasharray="3 3"/><text x={Math.min(210,x(index)+4)} y="9">Начало лечения</text></g>}
 <polyline points={rows.map((r,i)=>`${x(i)},${y(r[field.key])}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
 {rows.length>0&&<><text x="30" y="137">{dateLabel(rows[0].date)}</text><text x="310" y="137" textAnchor="end">{dateLabel(rows[rows.length-1].date)}</text></>}
 </svg>;
}
function VetCare({pet,host}:{pet:{name:string;photo:string};host:HTMLElement|null}){
 const keyboard=useKeyboard();
 const [open,setOpen]=useState(false),[step,setStep]=useState<'reason'|'summary'|'after'>('reason');
 const [reason,setReason]=useState(''),[onset,setOnset]=useState(''),[treatment,setTreatment]=useState(''),[days,setDays]=useState(7);
 const [included,setIncluded]=useState<string[]>(vetFields.map(f=>f.key));
 const [files,setFiles]=useState<File[]>([]),[stored,setStored]=useState<MedicalFile[]>([]),[selected,setSelected]=useState<string[]>([]);
 const [error,setError]=useState(''),[status,setStatus]=useState(''),[busy,setBusy]=useState(false),[note,setNote]=useState(''),[notes,setNotes]=useState<{text:string;date:string}[]>([]);
 const picker=useRef<HTMLInputElement>(null);
 const bodyRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{const id=requestAnimationFrame(()=>bodyRef.current?.closest('.sheet-content')?.scrollTo({top:0,behavior:'instant'}));return()=>cancelAnimationFrame(id);},[step,open]);
 const previous=vetReadings.filter(r=>r.date>='2026-08-11'&&r.date<='2026-09-07'),current=vetReadings.filter(r=>r.date>='2026-09-08'&&r.date<='2026-09-14');
 const baseline=vetAverage(previous,'active'),now=vetAverage(current,'active');
 const decrease=baseline&&now!==null?Math.round((baseline-now)/baseline*100):0;
 const before=treatment?vetReadings.filter(r=>r.date>=moveDate(treatment,-days)&&r.date<treatment):[];
 const after=treatment?vetReadings.filter(r=>r.date>=treatment&&r.date<moveDate(treatment,days)):[];
 const complete=before.length===days&&after.length===days;
 const switchStep=(next:typeof step)=>{keyboard.hide();setError('');setStatus('');setStep(next);};
 const show=(next:typeof step)=>{switchStep(next);setOpen(true);void medicalStore<MedicalFile[]>('readonly',s=>s.getAll()).then(setStored).catch(()=>setError('Не удалось открыть медкарту. Можно добавить файлы с устройства.'));};
 const fileList=()=>[...files,...stored.filter(f=>selected.includes(f.id)).map(f=>new File([f.blob],f.name,{type:f.type}))];
 const summary=()=>[`${pet.name} — сводка для ветеринара`,included.includes('active')?'Изменение активности: −'+decrease+'%':'','Раньше: 11 августа — 7 сентября 2026. Сейчас: 8–14 сентября 2026.','Средние за полный день. Источник: устройство.',...vetFields.filter(f=>included.includes(f.key)).map(f=>`${f.label}: ${vetNumber(vetAverage(previous,f.key))} → ${vetNumber(vetAverage(current,f.key))} ${f.unit}/день`),'Еда и питьё — количество подходов, не объём потребления.',`Причина: ${reason.trim()}`,onset?`Изменения замечены: ${onset}`:'',`Документы: ${fileList().map(f=>f.name).join(', ')||'не приложены'}`,'Это наблюдения, не диагноз.'].filter(Boolean).join('\n');
 const download=(blob:Blob,name:string)=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
 const share=async()=>{setError('');setStatus('');setBusy(true);try{const attachments=[new File([summary()],'whoof-summary.txt',{type:'text/plain'}),...fileList()];if(navigator.share&&navigator.canShare?.({files:attachments})){await navigator.share({title:`${pet.name}: сводка`,files:attachments});}else{download(new Blob([summary()],{type:'text/plain;charset=utf-8'}),'whoof-summary.txt');setStatus('Сводка скачана. Прикреплённые документы можно скачать по отдельности ниже.');}}catch(e){if(!(e instanceof Error&&e.name==='AbortError'))setError('Не удалось поделиться. Попробуйте скачать сводку.');}finally{setBusy(false);}};
 const addFiles=(incoming:FileList|null)=>{if(!incoming)return;let message='';const valid=Array.from(incoming).filter(f=>{if(f.size>20*1024*1024){message='Файл больше 20 МБ не добавлен.';return false;}if(!(/\.(pdf|png|jpe?g|webp|heic|docx?)$/i.test(f.name))){message='Поддерживаются PDF, изображения и документы Word.';return false;}return true;});setFiles(old=>[...old,...valid.filter(f=>!old.some(o=>o.name===f.name&&o.size===f.size))]);setError(message);};
 return <>
 {host&&decrease>30&&createPortal(<section className="vet-insight vet-insight-compact"><div className="vet-insight-heading"><AccentIcon icon={ChartBar} tone="purple"/><h2>Активность снизилась на {decrease}%</h2></div><p>8–14 сентября · к предыдущим 28 дням</p><div className="vet-insight-actions"><button className="vet-followup" onClick={()=>show('after')}>После лечения</button><button className="vet-contact" aria-label="Обратиться к ветеринару" onClick={()=>show('reason')}>К ветеринару<CaretRight size={15}/></button></div></section>,host)}
 <BottomSheet open={open} onOpenChange={value=>{keyboard.hide();setOpen(value);}} title={step==='reason'?'Обращение':step==='summary'?'Что изменилось':'После лечения'} description="" snap={.96}>
 <div ref={bodyRef} className="sheet-body vet-body"><button className="sheet-close icon-button" aria-label="Закрыть обращение" onClick={()=>{keyboard.hide();setOpen(false);}}><X size={20}/></button>
 <div className="vet-pet">{step!=='reason'&&<button className="icon-button" aria-label="Назад к обращению" onClick={()=>switchStep('reason')}><ArrowLeft size={20}/></button>}<img src={pet.photo} alt=""/><strong>{pet.name}</strong><span>WHOOF</span></div>
 {step==='reason'&&<><label className="vet-label">Причина обращения<KeyboardTextarea aria-label="Причина обращения" value={reason} onChange={e=>setReason(e.target.value)} placeholder="Что изменилось в поведении питомца?" rows={4} maxLength={1000}/><small>{reason.length}/1000</small></label><label className="vet-label">Когда заметили изменения? <span>Необязательно</span><KeyboardInput aria-label="Когда заметили изменения" type="date" max={dateKey(new Date())} value={onset} onChange={e=>setOnset(e.target.value)}/></label>
 <h3>Данные устройства</h3><p className="vet-muted">Автоматически добавлены в обращение. Можно исключить ненужное.</p><div className="vet-data">{vetFields.map(f=><label key={f.key}><AccentIcon icon={f.icon} tone={f.tone}/><span>{f.label}<small>{vetNumber(vetAverage(current,f.key))} {f.unit}/день</small></span><input type="checkbox" aria-label={`Включить: ${f.label}`} checked={included.includes(f.key)} onChange={e=>setIncluded(v=>e.target.checked?[...v,f.key]:v.filter(k=>k!==f.key))}/></label>)}</div><p className="vet-muted">8–14 сентября 2026 · полные дни.<br/>Еда и питьё — количество подходов, не объём.</p>
 <h3>Медицинские документы</h3>{stored.map(f=><label className="vet-file-choice" key={f.id}><FileText size={20}/><span>{f.name}<small>Из медкарты · {medicalSize(f.size)}</small></span><input type="checkbox" aria-label={`Приложить ${f.name}`} checked={selected.includes(f.id)} onChange={e=>setSelected(s=>e.target.checked?[...s,f.id]:s.filter(id=>id!==f.id))}/></label>)}
 <input ref={picker} type="file" multiple hidden accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.doc,.docx" onChange={e=>{addFiles(e.target.files);e.target.value='';}}/>
 <button className="secondary full vet-attach" onClick={()=>{keyboard.hide();picker.current?.click();}}><Plus size={18}/>Добавить документы</button><p className="vet-muted">Необязательно · до 20 МБ на файл</p>{files.map((f,i)=><div className="vet-file-choice" key={`${f.name}-${i}`}><FileText size={20}/><span>{f.name}<small>{medicalSize(f.size)}</small></span><button className="icon-button" aria-label={`Убрать ${f.name}`} onClick={()=>setFiles(old=>old.filter((_,n)=>n!==i))}><X size={17}/></button></div>)}
 <p className="vet-privacy"><LockSimple size={15}/>Ничего не отправляется автоматически. Новые файлы и обращение остаются здесь до перезагрузки.</p><button className="primary full" disabled={!reason.trim()} onClick={()=>switchStep('summary')}>Посмотреть сводку<CaretRight size={18}/></button></>}
 {step==='summary'&&<><h3>Сводка для ветеринара</h3><p className="vet-muted">Среднее за полный день · источник: устройство</p><div className="vet-table"><div><span/><span>Раньше<small>11 авг. — 7 сент.</small></span><span>Сейчас<small>8–14 сент.</small></span></div>{vetFields.filter(f=>included.includes(f.key)).map(f=><div key={f.key}><span><f.icon size={18}/>{f.label}</span><span>{vetNumber(vetAverage(previous,f.key))} {f.unit}</span><strong>{vetNumber(vetAverage(current,f.key))} {f.unit}</strong></div>)}</div>{!included.length&&<p className="vet-muted">Показатели исключены из обращения.</p>}<h3>Наблюдения владельца</h3>{onset&&<p className="vet-muted">Изменения замечены {dateLabel(onset)}</p>}<blockquote>{reason}</blockquote><h3>Документы · {fileList().length}</h3>{fileList().map((f,i)=><button key={i} className="vet-file-choice" onClick={()=>download(f,f.name)}><FileText size={20}/><span>{f.name}<small>Скачать оригинал · {medicalSize(f.size)}</small></span><DownloadSimple size={18}/></button>)}{!fileList().length&&<p className="vet-muted">Документы не приложены.</p>}<p className="vet-privacy"><LockSimple size={15}/>Передайте сводку выбранному врачу.</p><button className="primary full" disabled={busy} onClick={()=>void share()}><ShareNetwork size={18}/>{busy?'Подготовка…':'Поделиться с врачом'}</button><button className="secondary full" onClick={()=>{download(new Blob([summary()],{type:'text/plain;charset=utf-8'}),'whoof-summary.txt');setStatus('Сводка скачана в текстовом формате.');}}>Скачать сводку</button><button className="vet-followup" onClick={()=>switchStep('after')}>Сравнить до и после лечения<CaretRight size={17}/></button></>}
 {step==='after'&&<><p className="vet-muted">Наблюдение за динамикой, без оценки эффективности лечения.</p><label className="vet-label">Начало лечения<KeyboardInput type="date" aria-label="Начало лечения" min="2026-08-04" max="2026-09-28" value={treatment} onChange={e=>setTreatment(e.target.value)}/></label><p className="vet-muted">Данные устройства: 4 августа — 28 сентября 2026. Укажите дату из назначения врача.</p><div className="segment" aria-label="Период сравнения">{[7,14,30].map(n=><button key={n} aria-pressed={days===n} className={days===n?'active':''} onClick={()=>setDays(n)}>{n} дней</button>)}</div>
 {!treatment?<div className="vet-empty"><CalendarBlank size={30}/><h3>Выберите дату начала</h3><p>Сравним одинаковое число полных дней до и после неё.</p></div>:<><h3>До / После</h3><p className="vet-muted">{dateLabel(moveDate(treatment,-days))} — {dateLabel(moveDate(treatment,-1))}<br/>{dateLabel(treatment)} — {dateLabel(moveDate(treatment,days-1))}</p>{complete?<div className="vet-table"><div><span/><span>До</span><span>После</span></div>{vetFields.map(f=><div key={f.key}><span><f.icon size={18}/>{f.label}</span><span>{vetNumber(vetAverage(before,f.key))} {f.unit}</span><strong>{vetNumber(vetAverage(after,f.key))} {f.unit}</strong></div>)}</div>:<p className="vet-empty" role="status">Недостаточно данных для {days} дней с каждой стороны. Доступно: {before.length} до и {after.length} после. Выберите другой период или дату.</p>}{vetFields.map(f=><section className="vet-chart-card" key={f.key}><h3><AccentIcon icon={f.icon} tone={f.tone}/>{f.label}<small>{f.unit}/день</small></h3><VetLine rows={[...before,...after]} field={f} marker={treatment}/></section>)}</>}
 <h3>Наблюдения владельца</h3>{notes.map((n,i)=><blockquote key={i}>{n.text}<small>{n.date}</small></blockquote>)}<KeyboardTextarea aria-label="Новое наблюдение" placeholder="Что изменилось в самочувствии и поведении?" rows={3} maxLength={1000} value={note} onChange={e=>setNote(e.target.value)}/><button className="secondary full" disabled={!note.trim()} onClick={()=>{keyboard.hide();setNotes(v=>[...v,{text:note.trim(),date:new Date().toLocaleDateString('ru-RU')}]);setNote('');}}>Добавить наблюдение</button><p className="vet-muted">Изменения показателей не заменяют оценку врача. Наблюдения сохраняются до перезагрузки.</p></>}
 {error&&<p role="alert" className="medical-error">{error}</p>}{status&&<p role="status" className="vet-muted">{status}</p>}
 </div></BottomSheet>
 </>;
}

function Whoof(){
 const [vetHost,setVetHost]=useState<HTMLDivElement|null>(null);
 const [recapOpen,setRecapOpen]=useState(false);
 const taskState=usePetTasks();
 const [incomingInvite]=useState(()=>new URLSearchParams(window.location.search).get('invite'));
 const [previewInvite,setPreviewInvite]=useState(false),[isCoOwner,setIsCoOwner]=useState(false);
 const [unread,setUnread]=useState(true);
 const [friendWalk,setFriendWalk]=useState<FriendWalkStage>('invited');
 const [notificationRun,setNotificationRun]=useState(0),[notificationAt,setNotificationAt]=useState<number|null>(null);
 const [profileFrom,setProfileFrom]=useState<Page>('settings');
 const [page,setPage]=useState<Page>(incomingInvite?'invite':'home'),[aiFrom,setAiFrom]=useState<Page>('home'),[sheet,setSheet]=useState<string|null>(null),[selectedDog,setSelectedDog]=useState(0),[invited,setInvited]=useState<string[]>([]);
 const [sharing,setSharing]=useState(false),[notifications,setNotifications]=useState(true),[zoom,setZoom]=useState(1),[walkTab,setWalkTab]=useState<'nearby'|'history'>('nearby'),[recording,setRecording]=useState(false),[paused,setPaused]=useState(false),[seconds,setSeconds]=useState(0);
 const [walks,setWalks]=useState<Walk[]>([{id:1,title:'Дневная прогулка',date:'Сегодня, 11:20',duration:'42 мин',distance:'2,4 км',friends:'С Боней и Анной'},{id:2,title:'Утренняя прогулка',date:'Сегодня, 07:30',duration:'35 мин',distance:'1,8 км',friends:'Вдвоём с Джекой'},{id:3,title:'Вечер в парке',date:'Вчера, 19:10',duration:'56 мин',distance:'3,2 км',friends:'С Ричи и Михаилом'}]);
 const [selectedWalk,setSelectedWalk]=useState<Walk|null>(null),[metric,setMetric]=useState(0),[period,setPeriod]=useState<MetricPeriod>('День');
 const [nutritionKind,setNutritionKind]=useState<NutritionKind>('food');
 const [pet,setPet]=useState({name:'Джека',photo:DOG,breed:'Золотистый ретривер',age:'3 года',weight:'28,5',height:'',chronicConditions:'',sterilized:true}),[draft,setDraft]=useState(pet);
 const [message,setMessage]=useState(''),[toast,setToast]=useState('');
 const [aiContext,setAiContext]=useState<ChatContext|null>(null);
 const [homeRestore,setHomeRestore]=useState<HomeRestore|null>(null);
 const [conversations,setConversations]=useState<Record<string,ChatMessage[]>>({});
 const chatKey=aiContext?.key||'general';
 const messages=conversations[chatKey]||[];
 const setMessages=(update:(previous:ChatMessage[])=>ChatMessage[])=>setConversations(all=>({...all,[chatKey]:update(all[chatKey]||[])}));
 const photoPicker=useRef<HTMLInputElement>(null),photoRequest=useRef(0);
 const [photoBusy,setPhotoBusy]=useState(false),[photoError,setPhotoError]=useState('');
 const choosePhoto=()=>{keyboard.hide();setPhotoError('');photoPicker.current?.click();};
 useEffect(()=>{if(sheet!=='edit'){photoRequest.current++;setPhotoBusy(false);}},[sheet]);
 const loadPhoto=(file:File|undefined)=>{
  if(!file)return;setPhotoError('');
  if(!file.type.startsWith('image/')){setPhotoError('Выберите изображение.');return;}
  if(file.size>10*1024*1024){setPhotoError('Фото должно быть не больше 10 МБ.');return;}
  const request=++photoRequest.current;setPhotoBusy(true);
  const reader=new FileReader();
  const fail=()=>{if(request===photoRequest.current){setPhotoError('Не удалось открыть фото. Попробуйте JPEG, PNG или WebP.');setPhotoBusy(false);}};
  reader.onerror=fail;reader.onload=()=>{if(request!==photoRequest.current)return;const src=String(reader.result),image=new Image();image.onerror=fail;image.onload=()=>{if(request!==photoRequest.current)return;setDraft(current=>({...current,photo:src}));setPhotoBusy(false);};image.src=src;};reader.readAsDataURL(file);
 };
 const keyboard=useKeyboard();const {bottomInset}=useKeyboardInsets();const chatEnd=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(page!=='ai'||!messages.length)return;const id=requestAnimationFrame(()=>{const scroller=chatEnd.current?.closest('[data-testid="mobile-scroll"]');scroller?.scrollTo({top:scroller.scrollHeight,behavior:'smooth'});});return()=>cancelAnimationFrame(id);},[messages,page]);
 useEffect(()=>{if(!recording||paused)return;const id=setInterval(()=>setSeconds(s=>s+1),1000);return()=>clearInterval(id);},[recording,paused]);
 useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(''),2800);return()=>clearTimeout(id);},[toast]);
 function navigate(p:Page){if(p==='home')setHomeRestore(null);if(p==='profile'&&page!=='ai')setProfileFrom(page==='home'?'home':'settings');keyboard.hide();setToast('');setSheet(null);setPage(p);}function openAI(){setAiFrom(page);setAiContext(null);setMessage('');navigate('ai');}
 function openMetricAI(){
  const reading=metricsForPeriod(period)[metric],range=metricDateRange(period);
  const context:MetricChatContext={kind:'metric',key:`${metric}:${period}:${range}`,name:reading.name,period,range,value:reading.value,unit:reading.unit,note:reading.note,detail:reading.detail};
  setAiContext(context);setAiFrom(page);setMessage('');navigate('ai');
 }
 function openHomeAI(context:HomeChatContext){setAiContext(context);setAiFrom('home');setMessage('');navigate('ai');}
 function leaveAI(){navigate(aiFrom);if(aiContext?.kind==='metric')setSheet('metric');else if(aiContext)setHomeRestore(aiContext.restore);}
function openSheet(s:string){keyboard.hide();setSheet(s);}
 function send(text=message){const value=text.trim();if(!value)return;keyboard.hide();setMessage('');let answer=`Сегодня ${pet.name} был в движении 2 ч 15 мин и в покое 12 ч 15 мин. Основные периоды активности — утренняя и дневная прогулки. Сейчас он отдыхает.`;if(aiContext&&aiContext.kind!=='metric')answer=aiContext.response;else if(aiContext)answer=`${aiContext.name} · ${aiContext.range}. ${aiContext.period==='День'?'Значение':'Среднее за день'} — ${aiContext.value}${aiContext.unit?' '+aiContext.unit:''}. ${aiContext.detail} По одному значению нельзя определить причину изменений; полезно сопоставить его с обычным режимом питомца.`;else if(/сон|спит|спал/i.test(value))answer='Сегодня до 14:30 распознано 8 ч 40 мин сна: 7 часов ночью и 1 ч 40 мин днём. Ночной отрезок — 00:00–07:00, дневной — 09:00–10:40. Это длительность распознанного сна, а не оценка его качества.';else if(/гуля|прогул/i.test(value))answer='Сегодня уже сохранены две прогулки: 35 и 42 минуты, всего 4,2 км. Сейчас Джека отдыхает после дневной прогулки. Следующую прогулку можно записать в разделе «Прогулки».';else if(/пульс|дыхани|температур/i.test(value))answer='Ошейник не измеряет пульс, дыхание и температуру. По движениям можем показать активность, ходьбу, бег, периоды сна и события еды и питья.';else if(/скорост|км.?ч/i.test(value))answer='По распознаванию ходьбы и бега нельзя определить скорость в км/ч. Сегодня записано 1 ч 45 мин ходьбы и 30 мин бега.';else if(/ел|еда|еды|пил|вод|пить/i.test(value))answer='Сегодня до 14:30 распознана еда в 08:15 и питьё в 08:27 и 12:55. Это события по движениям, а не количество съеденного или выпитого.';else if(/бег|ходьб|двига/i.test(value))answer='Сегодня до 14:30 Джека двигался 2 ч 15 мин: 1 ч 45 мин ходьбы и 30 мин бега. Без движения — 12 ч 15 мин, включая 8 ч 40 мин сна.';else if(!/день|измен|актив|состоя|самочув|показател/i.test(value))answer='Могу помочь разобраться в активности, сне, показателях или прогулках Джеки. Что хотите обсудить?';setMessages(m=>[...m,{role:'user',text:value},{role:'assistant',text:answer}]);}
 function joinFriendWalk(){
  if(friendWalk!=='invited'||recording)return;
  setFriendWalk('walking');setUnread(false);setWalkTab('nearby');navigate('walks');
 }
 function finishFriendWalk(){
  if(friendWalk!=='walking')return;
  const walk:Walk={id:-1,title:`${pet.name} и Боня`,date:'Сегодня · только что',duration:'42 мин',distance:'2,4 км',friends:'Вместе с Боней и Анной',joint:true};
  setFriendWalk('finished');setWalks(items=>[walk,...items.filter(item=>!item.joint)]);setSelectedWalk(walk);setWalkTab('history');setUnread(true);openSheet('walk');
 }
 function openFriendWalk(){

  if(friendWalk==='finished'){const walk=walks.find(item=>item.joint);if(walk){setSelectedWalk(walk);openSheet('walk');}}
  else {setWalkTab('nearby');navigate('walks');}
 }
 function scheduleFriendNotification(){
  if(friendWalk==='walking'||recording){setToast('Сначала завершите текущую прогулку');return;}
  if(!notifications){setToast('Включите уведомления в настройках');return;}
  setFriendWalk('invited');setUnread(true);setNotificationAt(Date.now()+5000);setNotificationRun(value=>value+1);
 }
 function resetFriendWalk(){setFriendWalk('invited');setWalks(items=>items.filter(item=>!item.joint));setSelectedWalk(null);setUnread(true);setNotificationAt(null);setNotificationRun(value=>value+1);navigate('home');}
 function saveWalk(){const walk={id:Date.now(),title:'Новая прогулка',date:'Только что',duration:seconds<60?`${seconds} сек`:`${Math.floor(seconds/60)} мин`,distance:`${(seconds*.0013).toFixed(2).replace('.',',')} км`,friends:'Вдвоём с Джекой'};setWalks(w=>[walk,...w]);setRecording(false);setPaused(false);setWalkTab('history');setSelectedWalk(walk);setSheet('walk');}
 const time=`${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;
 const visibleMetrics=metricsForPeriod(period);
 const selectedMetric=visibleMetrics[metric];
 const navPage=page==='profile'||page==='access'?'settings':page;
 const nav=[{id:'home' as Page,label:'Главная',Icon:House},{id:'metrics' as Page,label:'Метрики',Icon:ChartBar},{id:'walks' as Page,label:'Прогулки',Icon:PawPrint},{id:'settings' as Page,label:'Настройки',Icon:GearSix}];
 return <div className="whoof-app" onFocusCapture={e=>{const frame=(e.target as HTMLElement).closest('[data-phone-screen]');if(frame instanceof HTMLElement)requestAnimationFrame(()=>frame.scrollTo({top:0,left:0}));}}><VetCare pet={pet} host={vetHost}/><MobileScroll key={page} className="app-screen"><main className={`whoof-content page-${page} ${page==='home'?'home-content':''} ${page==='ai'?'chat-content':''} ${page==='settings'?'settings-content':''} ${page==='invite'?'invite-content':''}`}>
 {page==='home'&&<><header className="brand-header home-header"><button className="pet-picker" aria-label="Открыть профиль питомца" onClick={()=>navigate('profile')}><img src={pet.photo} alt={pet.name}/><span>{pet.name}</span><CaretRight size={16}/></button><button className="friend-notification-trigger" aria-label="Показать приглашение через 5 секунд" onClick={scheduleFriendNotification}/><button className="icon-button notification-button" aria-label="Уведомления" onClick={()=>{setUnread(false);openSheet('notifications');}}><Bell size={24}/>{unread&&<i/>}</button></header><section className="wellbeing"><h1>Самочувствие<br/><span>отличное</span></h1><p>{friendWalk==='walking'?`Сейчас ${pet.name} гуляет с Боней в парке.`:`Сейчас ${pet.name} отдыхает после дневной прогулки.`}</p></section><AnnualRecap open={recapOpen} onOpenChange={setRecapOpen}/>{friendWalk!=='invited'&&<FriendWalkNotice stage={friendWalk} petName={pet.name} petPhoto={pet.photo} onJoin={joinFriendWalk} onOpen={openFriendWalk} blocked={recording}/>}<PetTasks state={taskState}/><HomeActivity onDiscuss={openHomeAI} restore={homeRestore}/></>}

 {page==='metrics'&&<><div className="page-top"><h1>Метрики</h1></div><p className="intro metrics-intro">Движение, сон и привычные события дня.</p><div ref={setVetHost}/></>}
 {page==='metrics'&&<>
  <div className="segment metrics-period" role="group" aria-label="Период метрик">{metricPeriods.map(p=><button key={p} className={period===p?'active':''} aria-pressed={period===p} onClick={()=>setPeriod(p)}>{p}</button>)}</div>
  <p className="metrics-date">{metricDateRange(period)}{period==='День'?' · до 14:30':' · полные дни'}</p>
  <div className="metric-tiles">{visibleMetrics.map((m,i)=><button className="metric-tile" aria-label={`Подробнее: ${m.name}`} key={m.name} onClick={()=>{setMetric(i);openSheet('metric');}}><div className="metric-tile-heading"><AccentIcon icon={m.icon} tone={metricTones[i]}/><CaretRight size={13}/></div><div className="metric-tile-bottom"><h2>{m.name}</h2><div className="metric-tile-value"><MetricNumber value={m.value}/>{m.unit&&<span>{m.unit}</span>}</div><p>{m.note}</p></div></button>)}</div><NutritionEvents period={period} onOpen={kind=>{setNutritionKind(kind);openSheet('nutrition');}}/></>}
 {page==='walks'&&<><div className="page-top"><div><p className="eyebrow">ВРЕМЯ ВМЕСТЕ</p><h1>Прогулки</h1></div></div><div className="segment"><button className={walkTab==='nearby'?'active':''} onClick={()=>setWalkTab('nearby')}>Рядом</button><button className={walkTab==='history'?'active':''} onClick={()=>setWalkTab('history')}>Мои прогулки</button></div>{walkTab==='nearby'?friendWalk==='walking'?<section className="friend-active"><div className="friend-active-heading"><span className="friend-active-label"><Users size={16}/>Общая прогулка</span><h2>{pet.name} и Боня</h2><p>Вы присоединились. Встречайтесь с Анной и Боней у круглой площадки в парке.</p></div><FriendWalkMap/><div className="friend-companions"><img src={pet.photo} alt=""/><span><PawPrint size={21} weight="fill"/></span><p>Вы и {pet.name}<br/><strong>Боня и Анна</strong></p><Check size={20}/></div><button className="primary full" onClick={finishFriendWalk}><Stop size={18}/>Завершить прогулку</button><p className="friend-hint">Локальный сценарий: можно сразу перейти к итогу. Геопозиция не записывается.</p></section>:<>{friendWalk==='invited'&&<FriendWalkNotice stage={friendWalk} petName={pet.name} petPhoto={pet.photo} onJoin={joinFriendWalk} onOpen={openFriendWalk} blocked={recording}/>}<div className="map-panel"><div className="map-world" style={{transform:`scale(${zoom})`}}><img src={MAP} alt="Демонстрационная карта района с парком"/>{dogs.map((d,i)=><button key={d.name} className="dog-pin" style={{left:`${d.x}%`,top:`${d.y}%`}} aria-label={`${d.name}, ${d.distance}`} onClick={()=>{setSelectedDog(i);openSheet('dog');}}><PawPrint weight="fill" size={21}/><span>{d.name}</span></button>)}<span className="my-location" style={{left:'58%',top:'44%'}}><NavigationArrow weight="fill" size={19}/></span></div><div className="map-controls"><button aria-label="Приблизить карту" disabled={zoom>=1.8} onClick={()=>setZoom(z=>Math.min(1.8,z+.2))}><Plus size={18}/></button><button aria-label="Отдалить карту" disabled={zoom<=1} onClick={()=>setZoom(z=>Math.max(1,z-.2))}><Minus size={18}/></button><button aria-label="Моя позиция" onClick={()=>{setZoom(1);setToast('Вы в центре карты');}}><NavigationArrow size={18}/></button></div></div><button className="sharing-row" onClick={()=>openSheet('location')}><span><MapPin size={17}/>{sharing?'Вы делитесь геопозицией':'Ваша геопозиция скрыта'}</span><CaretRight size={16}/></button>{recording?<div className="record-panel"><div className="record-top"><span>{paused?'Запись на паузе':'Прогулка записывается'}</span></div><div className="walk-stats"><div><strong>{time}</strong><span>Время</span></div><div><strong>{(seconds*.0013).toFixed(2).replace('.',',')}</strong><span>км</span></div></div><div className="button-pair"><button className="secondary" onClick={()=>setPaused(p=>!p)}>{paused?<Play/>:<Pause/>}{paused?'Продолжить':'Пауза'}</button><button className="primary" onClick={saveWalk}><Stop/>Завершить</button></div></div>:<button className="primary full" onClick={()=>{setSeconds(0);setPaused(false);setRecording(true);}}><Play weight="fill" size={18}/>Начать прогулку</button>}<div className="section-heading"><h2>Кто рядом</h2><span>3 собаки</span></div>{dogs.map((d,i)=><button key={d.name} className="nearby-row" onClick={()=>{setSelectedDog(i);openSheet('dog');}}><div className="pet-icon"><PawPrint size={24}/></div><div><strong>{d.name}</strong><p>{d.breed}</p></div><span>{invited.includes(d.name)?<Check size={18}/>:d.distance}</span><CaretRight size={15}/></button>)}</>:<><p className="intro small">Ваши маршруты и хорошие моменты.</p>{walks.map(w=><button className="history-row" key={w.id} onClick={()=>{setSelectedWalk(w);openSheet('walk');}}><div className="walk-thumb"><img src={w.joint?FRIEND_WALK_PHOTO:MAP} alt=""/>{!w.joint&&<Path size={26}/>}</div><div><span className="muted tiny">{w.date}</span><h3>{w.title}</h3><p>{w.duration} <span>·</span> {w.distance}</p><span className="tiny muted">{w.friends}</span></div><CaretRight size={16}/></button>)}</>}</>}
 {page==='settings'&&<>
  <div className="page-top"><h1>Настройки</h1></div>
  <button className="settings-invite-banner" aria-label="Доступ к питомцу: пригласить второго владельца" onClick={()=>navigate('access')}><AccentIcon icon={QrCode} tone="dark"/><span><strong>Забота на двоих</strong><small>{isCoOwner?'Общий доступ к питомцу':'Пригласить второго владельца'}</small></span><CaretRight size={15}/></button>
  <h2 className="settings-section-label">Питомец и устройство</h2>
  <section className="settings-group settings-destinations" aria-label="Питомец и устройство">
   <button className="settings-entry pet-entry" onClick={()=>navigate('profile')}><img src={pet.photo} alt=""/><span><strong>Профиль питомца</strong><small>{pet.name} · данные и здоровье</small></span><CaretRight size={17}/></button>
   <button className="settings-entry" onClick={()=>openSheet('collar')}><AccentIcon icon={Bluetooth} tone="blue"/><span><strong>Настройки устройства</strong><small>Whoof One · заряд 84%</small></span><CaretRight size={17}/></button>
  </section>
  {settingsGroups.map((group,index)=><section key={index} className="settings-group" aria-label={['Общие настройки','Информация','Помощь'][index]}>{index<2&&<h2 className="settings-section-label">{['Общие настройки','Информация'][index]}</h2>}{group.map(({id,label,Icon})=><button key={id} className="settings-entry" onClick={()=>openSheet(id)}><AccentIcon icon={Icon} tone={settingTones[id]}/><span>{label}</span>{id==='language'&&<small>Русский</small>}<CaretRight size={16}/></button>)}</section>)}
 </>}
 {page==='access'&&<PetAccess name={pet.name} photo={pet.photo} isMember={isCoOwner} onBack={()=>navigate('settings')} onPreview={()=>{setPreviewInvite(true);navigate('invite');}} onOwner={()=>setIsCoOwner(false)}/>}
 {page==='invite'&&<JoinPet name={previewInvite?pet.name:'Джека'} breed={previewInvite?pet.breed:'Золотистый ретривер'} photo={previewInvite?pet.photo:DOG} preview={previewInvite} valid={previewInvite||incomingInvite===INVITE_PREVIEW_TOKEN} onCancel={()=>{if(!previewInvite)window.history.replaceState(null,'',window.location.pathname);navigate(previewInvite?'access':'home');}} onAccept={()=>{if(previewInvite){navigate('access');}else{window.history.replaceState(null,'',window.location.pathname);setIsCoOwner(true);navigate('home');}}}/>}
 {page==='profile'&&<>
  <header className="profile-page-header"><button className="icon-button" aria-label={profileFrom==='home'?'Назад на главную':'Назад в настройки'} onClick={()=>navigate(profileFrom)}><ArrowLeft size={23}/></button><h1>Профиль питомца</h1></header>
  <div className="profile-hero"><img src={pet.photo} alt={pet.name}/><h2>{pet.name}</h2><button className="text-button" onClick={()=>{setPhotoError('');setDraft(pet);openSheet('edit');}}><PencilSimple size={15}/>Изменить профиль</button></div>
  <section aria-label="Данные питомца" className="profile-data"><div><span>Возраст</span><strong>{pet.age}</strong></div><div><span>Вес</span><strong>{pet.weight} кг</strong></div><div><span>Порода</span><strong>{pet.breed}</strong></div><div><span>Стерилизация</span><strong>{pet.sterilized?'Да':'Нет'}</strong></div><div><span>Рост в холке</span><strong>{pet.height?`${pet.height} см`:'Не указан'}</strong></div><div className="chronic-row"><span>Хронические заболевания</span><strong>{pet.chronicConditions||'Не указаны'}</strong></div></section>

  <MedicalRecordBlock/>
 </>}
 {page==='ai'&&<><header className="ai-header"><button className="icon-button" aria-label="Назад" onClick={leaveAI}><ArrowLeft size={22}/></button><div><strong>Whoof AI</strong></div><Sparkle size={24}/></header>{aiContext&&<div className="context-chip metric-chat-context"><span><strong>{aiContext.name} · {aiContext.period.toLowerCase()}</strong><small>{aiContext.range}</small></span><button className="text-button" onClick={()=>{setAiContext(null);setMessage('');}}>Общий чат</button></div>}{messages.length===0?<div className="chat-welcome"><h1>{aiContext?.kind==='insight'?'Разберём инсайт':aiContext?.kind==='summary'?'Разберём итоги дня':aiContext?'Разберём показатель':'Чем помочь?'}</h1><p>{aiContext?`${aiContext.value}${aiContext.unit?' '+aiContext.unit:''} · ${aiContext.note}`:'Спросите об активности, отдыхе или прогулках питомца.'}</p><div className="suggestions">{(aiContext?.kind==='insight'?['Что заметил трекер?','Насколько точен этот инсайт?']:aiContext?.kind==='summary'?['Как распределилось время за день?','На что обратить внимание?']:aiContext?[`Что означает этот показатель?`,`Как оценить изменения за ${aiContext.period==='День'?'день':aiContext.period==='Неделя'?'неделю':'месяц'}?`]:['Как прошёл день питомца?','Что изменилось в активности?','Как питомец спал?','Расскажи о прогулках']).map(q=><button onClick={()=>send(q)} key={q}>{q}<CaretRight size={16}/></button>)}</div></div>:<div className="messages">{messages.map((m,i)=><div key={i} className={`message ${m.role}`}>{m.role==='assistant'&&<span className="assistant-label"><Sparkle size={15}/>Whoof AI</span>}<p>{m.text}</p></div>)}<div ref={chatEnd}/></div>}</>}

 </main></MobileScroll>
 {page==='invite'?null:page!=='ai'?<nav className="bottom-nav" style={{bottom:bottomInset+8}} aria-label="Основная навигация"><div className="nav-capsule">{nav.map(({id,label,Icon})=><button key={id} onClick={()=>navigate(id)} aria-current={navPage===id?'page':undefined} className={navPage===id?'selected':''}><Icon size={25} weight="fill"/><span>{label}</span></button>)}</div><button className="ai-nav" aria-label="Обсудить с AI" onClick={openAI}><Sparkle size={25} weight="fill"/><span>AI</span></button></nav>:<form className="chat-composer" style={{bottom:bottomInset+8}} onSubmit={e=>{e.preventDefault();send();}}><KeyboardInput aria-label="Сообщение AI" value={message} onChange={e=>setMessage(e.target.value)} placeholder={aiContext?.kind==='insight'?'Спросить об инсайте…':aiContext?'Спросить об этих данных…':'Ваш вопрос…'}/><button onPointerDown={e=>e.preventDefault()} aria-label="Отправить сообщение" disabled={!message.trim()} type="submit"><ArrowUp size={22}/></button></form>}
 <input ref={photoPicker} type="file" accept="image/*" hidden aria-label="Выбрать фотографию питомца" onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';loadPhoto(file);}}/>
 {toast&&<div className="toast" role="status"><Check size={16}/>{toast}</div>}
 <IOSFriendNotification key={notificationRun} scheduledAt={notificationAt} enabled={friendWalk==='invited'&&notifications&&!sheet} petName={pet.name} onOpen={()=>{setUnread(false);openSheet('notifications');}}/>
 <BottomSheet open={sheet!==null} onOpenChange={o=>{if(!o)setSheet(null);}} title={sheet&&settingsTitles[sheet]?settingsTitles[sheet]:sheet==='notifications'?'Уведомления':sheet==='dog'?dogs[selectedDog].name:sheet==='metric'?metrics[metric].name:sheet==='nutrition'?(nutritionKind==='food'?'Когда ел':'Когда пил'):sheet==='walk'?(selectedWalk?.joint?'Вместе с Боней':'Детали прогулки'):sheet==='edit'?'Данные питомца':sheet==='location'?'Геопозиция':sheet==='collar'?'Ошейник Whoof':sheet==='settings'?'Настройки':'О прототипе'} description="" snap={sheet==='edit'||sheet==='metric'||sheet==='nutrition'||(sheet==='walk'&&selectedWalk?.joint)?.88:.72}><div className="sheet-body"><button className="sheet-close icon-button" aria-label="Закрыть" onClick={()=>{keyboard.hide();setSheet(null);}}><X size={19}/></button>
 {sheet==='notifications'&&<><FriendWalkNotice stage={friendWalk} petName={pet.name} petPhoto={pet.photo} onJoin={joinFriendWalk} onOpen={openFriendWalk} blocked={recording}/><button className="notification-row" onClick={()=>{setWalkTab('history');navigate('walks');}}><PawPrint size={23}/><div><strong>Прогулка сохранена</strong><p>Дневная прогулка: 42 минуты и 2,4 км.</p><span>Сегодня, 12:02</span></div><CaretRight size={16}/></button><button className="notification-row" onClick={()=>navigate('metrics')}><ChartBar size={23}/><div><strong>Новые данные Джеки</strong><p>Показатели активности и отдыха обновлены.</p><span>Сегодня, 14:30</span></div><CaretRight size={16}/></button></>}
 {sheet==='dog'&&<><div className="dog-detail"><div className="large-paw"><PawPrint size={38}/></div><p>{dogs[selectedDog].breed}</p><p>Хозяин: {dogs[selectedDog].owner} · {dogs[selectedDog].distance} от вас</p></div><div className="quiet-card"><Users size={21}/><p>Открыты к совместной прогулке в парке.</p></div><button className="primary full" disabled={invited.includes(dogs[selectedDog].name)} onClick={()=>{setInvited(a=>[...a,dogs[selectedDog].name]);}}>{invited.includes(dogs[selectedDog].name)?<><Check/>Приглашение отправлено</>:<><PawPrint/>Позвать на прогулку</>}</button></>}
 {sheet==='location'&&<><p className="intro small">Другие владельцы смогут увидеть вас на карте и пригласить на прогулку.</p><button className="settings-row" onClick={()=>setSharing(v=>!v)}><span>Делиться геопозицией</span><span className={`toggle ${sharing?'on':''}`} role="switch" aria-checked={sharing}><i/></span></button><p className="footnote">По умолчанию геопозиция скрыта.</p><button className="primary full" onClick={()=>setSheet(null)}>Готово</button></>}
 {sheet==='metric'&&<><div className="metric-detail-value">{selectedMetric.value}</div><p className="metric-value-caption">{period==='День'?'Сегодня · до 14:30':'В среднем за день'}</p><div className="segment" role="group" aria-label="Период метрики">{metricPeriods.map(p=><button key={p} className={period===p?'active':''} aria-pressed={period===p} onClick={()=>setPeriod(p)}>{p}</button>)}</div><MetricDurationChart values={selectedMetric.values} period={period} tone={metricTones[metric]}/><div className="chart-period">{metricDateRange(period)}</div><section className="metric-breakdown" aria-label="Из чего складывается показатель"><h3>{period==='День'?'За сегодня':'В среднем за день'}</h3>{selectedMetric.rows.map(row=><div key={row.label}><span>{row.label}</span><strong>{row.value}</strong></div>)}</section>
  {metric===0&&selectedMetric.idle&&<p className="metric-context-note">Без движения — {selectedMetric.idle}, включая сон. Это оставшаяся часть дня до 14:30.</p>}
  {metric===1&&period==='День'&&<section className="sleep-periods"><h3>Периоды сна</h3>{metricDay(dateKey(new Date())).sleepPeriods.map(block=><div key={block.start}><Moon size={16}/><span>{block.label}</span><time>{timeLabel(block.start)}–{timeLabel(block.end)}</time></div>)}</section>}
  {metric===1&&<p className="metric-context-note">Сон распознаётся по движениям. Продолжительность не оценивает качество сна.</p>}
  <button className="primary full ai-primary" onClick={openMetricAI}><Sparkle/>Обсудить с AI</button></>}
 {sheet==='nutrition'&&<><p className="nutrition-detail-range">{metricDateRange(period)}{period==='День'?' · до 14:30':''}</p><p className="nutrition-intro">Распознанные эпизоды {nutritionKind==='food'?'еды':'питья'}. Объём по ним не определяем.</p><div className="nutrition-days">{metricDays(period).reverse().map((key,i)=><details key={key} open={i===0}><summary>{key===dateKey(new Date())?'Сегодня':dateLabel(key)}<CaretDown size={15}/></summary>{nutritionEvents(key).filter(event=>event.kind===nutritionKind).map(event=><div key={event.time}><span>{nutritionKind==='food'?'Ел':'Пил воду'}</span><time>{event.time}</time></div>)}</details>)}</div></>}


 {sheet==='walk'&&selectedWalk&&(selectedWalk.joint?<><FriendWalkMemory petName={pet.name}/><button className="secondary full" onClick={()=>{setWalkTab('history');navigate('walks');}}>К моим прогулкам</button><button className="friend-replay" onClick={resetFriendWalk}>Повторить сценарий</button></>:<><img className="detail-map" src={MAP} alt="Карта района прогулки"/><h2>{selectedWalk.title}</h2><p className="muted">{selectedWalk.date}</p><div className="walk-stats"><div><Clock size={19}/><strong>{selectedWalk.duration}</strong><span>Время</span></div><div><Path size={19}/><strong>{selectedWalk.distance}</strong><span>Дистанция</span></div></div><div className="quiet-card"><Users size={21}/><p>{selectedWalk.friends}</p></div></>)}
 {sheet==='edit'&&<form className="pet-form" onSubmit={e=>{e.preventDefault();if(!draft.name.trim()||!draft.breed.trim()||!draft.age.trim())return;setPet({...draft,height:draft.height.trim(),chronicConditions:draft.chronicConditions.trim()});keyboard.hide();setSheet(null);setToast('Данные питомца обновлены');}}><div className="pet-form-photo"><button className="pet-photo-control" type="button" disabled={photoBusy} aria-label="Изменить фото питомца" onClick={choosePhoto}><span className="pet-photo-button"><img src={draft.photo} alt=""/><span><Camera size={17}/></span></span><span>{photoBusy?'Загружаем фото…':'Изменить фото'}</span></button></div>{photoError&&<p className="photo-error" role="alert">{photoError}</p>}{[{key:'name',label:'Имя'},{key:'breed',label:'Порода'},{key:'age',label:'Возраст'},{key:'weight',label:'Вес, кг'},{key:'height',label:'Рост в холке, см'}].map(({key,label})=><label key={key}>{label}<KeyboardInput required={key!=='height'} value={String(draft[key as keyof typeof draft])} onChange={e=>setDraft({...draft,[key]:e.target.value})} inputMode={key==='weight'||key==='height'?'decimal':'text'} pattern={key==='weight'||key==='height'?'[0-9]+([.,][0-9]+)?':undefined}/></label>)}<button type="button" className="settings-row" onClick={()=>setDraft({...draft,sterilized:!draft.sterilized})}><span>Стерилизован</span><span className={`toggle ${draft.sterilized?'on':''}`} role="switch" aria-checked={draft.sterilized}><i/></span></button><label>Хронические заболевания<KeyboardTextarea aria-label="Хронические заболевания" value={draft.chronicConditions} onChange={e=>setDraft({...draft,chronicConditions:e.target.value})} placeholder="Укажите заболевания или напишите «Нет»" rows={3} maxLength={1000}/></label><button className="primary full" type="submit" disabled={photoBusy}>Сохранить</button></form>}
 {sheet==='collar'&&<><div className="collar-icon"><Bluetooth size={40}/></div><h2>Всё на связи</h2><p className="intro small">Ошейник {pet.name} передаёт данные в приложение.</p><div className="profile-data"><div><span>Заряд</span><strong>84%</strong></div><div><span>Последняя синхронизация</span><strong>2 мин назад</strong></div><div><span>Устройство</span><strong>Whoof One</strong></div></div><button className="primary full" onClick={()=>setToast('Данные синхронизированы')}>Синхронизировать</button></>}
 {sheet==='security'&&<><p className="intro small">Вы управляете тем, что видят другие владельцы.</p><button className="settings-row" onClick={()=>setSheet('location')}><MapPin size={21}/><span>Делиться геопозицией</span><small className="muted">{sharing?'Включено':'Выключено'}</small><CaretRight size={16}/></button><div className="quiet-card"><LockSimple size={22}/><p>Документы медкарты хранятся в этом браузере и не видны другим владельцам.</p></div></>}
 {sheet==='notification-settings'&&<><p className="intro small">События дня, изменения активности и напоминания об ошейнике.</p><button className="settings-row" role="switch" aria-label="Получать уведомления" aria-checked={notifications} onClick={()=>setNotifications(v=>!v)}><Bell size={21}/><span>Получать уведомления</span><span aria-hidden="true" className={`toggle ${notifications?'on':''}`}><i/></span></button></>}
 {sheet==='language'&&<><p className="intro small">Язык интерфейса</p><button className="settings-row" aria-pressed="true"><Globe size={21}/><span>Русский</span><Check size={20}/></button><p className="footnote">Сейчас доступен русский язык.</p></>}
 {sheet==='privacy'&&<><p className="intro small">Ваши данные и приватность</p><div className="settings-copy"><p>Документы медкарты сохраняются только в этом браузере. После очистки данных браузера они удалятся.</p><p>Геопозиция по умолчанию скрыта. Вы можете изменить это в настройках безопасности.</p><p>Полная политика обработки данных будет доступна перед запуском сервиса.</p></div><button className="secondary full" onClick={()=>setSheet('security')}>Настройки безопасности</button></>}
 {sheet==='terms'&&<div className="settings-copy"><p>Сейчас вы знакомитесь с прототипом Whoof. Показатели и инсайты показывают, как будет работать приложение.</p><p>Полные правила пользования будут доступны перед запуском сервиса.</p></div>}
 {sheet==='faq'&&<div className="settings-faq">{[
 ['Что показывает карта дня?','График показывает интенсивность движения. Перемещайте ползунок, чтобы выбрать момент и посмотреть период активности или покоя.'],
 ['Как изменить данные питомца?','Откройте профиль питомца в настройках и нажмите «Изменить профиль». Здесь можно изменить фото и указать возраст, вес, породу, стерилизацию, рост в холке и хронические заболевания.'],
 ['Как добавить документы?','Откройте профиль питомца, затем медкарту. Нажмите «Добавить документы» и выберите фото, сканы или файлы.'],
 ['Почему инсайт начинается со слова «возможно»?','Трекер замечает изменения движения, но не знает их точную причину. Инсайт предлагает возможное объяснение.'],
 ].map(([question,answer])=><details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>}
 {sheet==='about'&&<><span className="wordmark">whoof</span><p className="intro">Ближе к тому,<br/>кого любишь.</p><p>Кликабельный прототип приложения для заботы о собаке. Показатели, карта и ответы AI — демонстрационные.</p><p className="footnote">Настройки прототипа хранятся до перезагрузки. Документы медкарты сохраняются в этом браузере.</p></>}
 </div></BottomSheet></div>;
}
