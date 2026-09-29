import {createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type InputHTMLAttributes, type TextareaHTMLAttributes, type PropsWithChildren, type Ref, type RefObject, type PointerEvent} from 'react';
import * as Dialog from '@radix-ui/react-dialog';

type NativeViewport = {height:number;top:number;safeBottom:number;keyboardVisible:boolean;root:RefObject<HTMLDivElement|null>};
const NativeContext=createContext<NativeViewport|null>(null);
function useNative(){const value=useContext(NativeContext);if(!value)throw new Error('NativeProvider required');return value;}
const dismissKeyboard=()=>{if(document.activeElement instanceof HTMLElement)document.activeElement.blur();};
export function NativeProvider({children}:PropsWithChildren){
 const root=useRef<HTMLDivElement>(null);
 const [viewport,setViewport]=useState({height:window.visualViewport?.height??window.innerHeight,top:0,safeBottom:0,keyboardVisible:false});
 useEffect(()=>{
  const probe=document.createElement('div');probe.style.cssText='position:fixed;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom,0px)';document.body.appendChild(probe);
  let frame=0;
  const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const vv=window.visualViewport;const typing=document.activeElement?.matches('input:not([type=file]),textarea,[contenteditable=true]')??false;const visible=typing&&window.innerHeight-(vv?.height??window.innerHeight)>100;setViewport({height:vv?.height??window.innerHeight,top:vv?.offsetTop??0,safeBottom:visible?0:parseFloat(getComputedStyle(probe).paddingBottom)||0,keyboardVisible:visible});});};
  update();window.visualViewport?.addEventListener('resize',update);window.visualViewport?.addEventListener('scroll',update);window.addEventListener('resize',update);document.addEventListener('focusin',update);document.addEventListener('focusout',update);
  return()=>{cancelAnimationFrame(frame);probe.remove();window.visualViewport?.removeEventListener('resize',update);window.visualViewport?.removeEventListener('scroll',update);window.removeEventListener('resize',update);document.removeEventListener('focusin',update);document.removeEventListener('focusout',update);};
 },[]);
 const value=useMemo(()=>({...viewport,root}),[viewport]);
 return <NativeContext.Provider value={value}><div ref={root} className="native-app-root" data-testid="native-app" style={{height:viewport.height,top:viewport.top,'--native-safe-bottom':`${viewport.safeBottom}px`} as React.CSSProperties}>{children}</div></NativeContext.Provider>;
}
export function useKeyboard(){return {hide:dismissKeyboard};}
export function useKeyboardInsets(){const viewport=useNative();return {bottomInset:viewport.safeBottom,isKeyboardVisible:viewport.keyboardVisible};}
export function KeyboardInput(props:InputHTMLAttributes<HTMLInputElement>&{ref?:Ref<HTMLInputElement>}){return <input {...props}/>;}
export function MobileScroll({children,className}:PropsWithChildren<{className?:string}>){return <section className={`mobile-page native-page ${className??''}`}><div className="mobile-scroll native-scroll" data-testid="mobile-scroll" onScroll={event=>{event.currentTarget.parentElement?.style.setProperty('--top-edge-opacity',String(Math.min(1,Math.max(0,event.currentTarget.scrollTop)/28)));}}><div className="mobile-scroll-content">{children}</div></div></section>;}
export function Carousel({children,className,contentClassName,ariaLabel,centered=false}:PropsWithChildren<{className?:string;contentClassName?:string;ariaLabel?:string;centered?:boolean}>){
 return <div className={`mobile-carousel native-carousel ${centered?'native-carousel-centered':''} ${className??''}`} aria-label={ariaLabel} role={ariaLabel?'region':undefined}><div className={`mobile-carousel-content ${contentClassName??''}`}>{children}</div></div>;
}
export function BottomSheet({open,onOpenChange,title,description,snap=.85,children}:PropsWithChildren<{open:boolean;onOpenChange:(open:boolean)=>void;title:string;description?:string;snap?:number}>){
 const {root,height}=useNative();
 const panel=useRef<HTMLDivElement>(null),shade=useRef<HTMLDivElement>(null);
 const drag=useRef<{id:number;startY:number;initial:number;offset:number;lastY:number;lastTime:number;velocity:number;height:number}|null>(null);
 // Parents clear their selected record on close. Keep its contents and size until Radix finishes the exit animation.
 const lastContent=useRef({title,description,snap,children});
 useLayoutEffect(()=>{if(open)lastContent.current={title,description,snap,children};},[open,title,description,snap,children]);
 const content=open?{title,description,snap,children}:lastContent.current;
 useEffect(()=>{if(open)dismissKeyboard();else drag.current=null;},[open]);
 function setOffset(offset:number,panelHeight:number){
  panel.current?.style.setProperty('--sheet-drag-y',`${offset}px`);
  shade.current?.style.setProperty('--sheet-shade-opacity',String(Math.max(0,1-offset/panelHeight)));
 }
 function restore(){
  panel.current?.removeAttribute('data-dragging');
  shade.current?.removeAttribute('data-dragging');
  setOffset(0,1);
 }
 function startDrag(event:PointerEvent<HTMLDivElement>){
  if(!open||!event.isPrimary||event.button!==0||!panel.current)return;
  const node=panel.current,transform=getComputedStyle(node).transform;
  const initial=transform==='none'?0:new DOMMatrixReadOnly(transform).m42;
  drag.current={id:event.pointerId,startY:event.clientY,initial,offset:initial,lastY:event.clientY,lastTime:event.timeStamp,velocity:0,height:node.offsetHeight};
  // Interrupt an entrance or a return animation at its actual current position.
  node.dataset.dragging='true';node.dataset.entered='true';
  if(shade.current){shade.current.dataset.dragging='true';shade.current.dataset.entered='true';}
  setOffset(initial,node.offsetHeight);
  event.currentTarget.setPointerCapture(event.pointerId);
 }
 function moveDrag(event:PointerEvent<HTMLDivElement>){
  const gesture=drag.current;if(!gesture||gesture.id!==event.pointerId)return;
  const elapsed=event.timeStamp-gesture.lastTime;
  if(elapsed>0)gesture.velocity=(event.clientY-gesture.lastY)/elapsed;
  gesture.lastY=event.clientY;gesture.lastTime=event.timeStamp;
  gesture.offset=Math.max(0,gesture.initial+event.clientY-gesture.startY);
  setOffset(gesture.offset,gesture.height);
 }
 function endDrag(event:PointerEvent<HTMLDivElement>,cancelled=false){
  const gesture=drag.current;if(!gesture||gesture.id!==event.pointerId)return;
  drag.current=null;
  const fast=event.timeStamp-gesture.lastTime<100&&gesture.velocity>.55&&gesture.offset>24;
  const threshold=Math.min(160,Math.max(80,gesture.height*.22));
  if(!cancelled&&(gesture.offset>threshold||fast)){
   dismissKeyboard();onOpenChange(false);
   // A busy upload may reject dismissal; return the panel in that case.
   requestAnimationFrame(()=>{if(panel.current?.dataset.state==='open')restore();});
  }else restore();
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
 }
 return <Dialog.Root open={open} onOpenChange={value=>{if(!value)dismissKeyboard();onOpenChange(value);}}><Dialog.Portal container={root.current}>
  <Dialog.Overlay ref={shade} className="sheet-overlay native-sheet-overlay" onAnimationEnd={event=>{if(event.animationName==='native-shade-enter')event.currentTarget.dataset.entered='true';}}/>
  <Dialog.Content ref={panel} className="bottom-sheet native-sheet" data-testid="bottom-sheet" style={{maxHeight:Math.min(height-12,height*content.snap)}} aria-describedby={undefined} onOpenAutoFocus={event=>event.preventDefault()} onAnimationEnd={event=>{if(event.target===event.currentTarget&&event.animationName==='native-sheet-enter')event.currentTarget.dataset.entered='true';}}>
   <div className="sheet-handle-zone" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={event=>endDrag(event)} onPointerCancel={event=>endDrag(event,true)} onLostPointerCapture={()=>{if(drag.current){drag.current=null;restore();}}}><div className="sheet-handle"/></div>
   <div className="sheet-header"><Dialog.Title className="sheet-title">{content.title}</Dialog.Title>{content.description&&<Dialog.Description className="sheet-description">{content.description}</Dialog.Description>}</div><div className="sheet-content">{content.children}</div>
  </Dialog.Content>
 </Dialog.Portal></Dialog.Root>;
}

export function KeyboardTextarea(props:TextareaHTMLAttributes<HTMLTextAreaElement>&{ref?:Ref<HTMLTextAreaElement>}){return <textarea {...props}/>;}
