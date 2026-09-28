import {createContext, useContext, useEffect, useMemo, useRef, useState, type InputHTMLAttributes, type TextareaHTMLAttributes, type PropsWithChildren, type Ref, type RefObject} from 'react';
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
export function MobileScroll({children,className}:PropsWithChildren<{className?:string}>){return <section className={`mobile-page native-page ${className??''}`}><div className="mobile-scroll native-scroll" data-testid="mobile-scroll"><div className="mobile-scroll-content">{children}</div></div></section>;}
export function Carousel({children,className,contentClassName,ariaLabel}:PropsWithChildren<{className?:string;contentClassName?:string;ariaLabel?:string}>){
 return <div className={`mobile-carousel native-carousel ${className??''}`} aria-label={ariaLabel} role={ariaLabel?'region':undefined}><div className={`mobile-carousel-content ${contentClassName??''}`}>{children}</div></div>;
}
export function BottomSheet({open,onOpenChange,title,description,snap=.85,children}:PropsWithChildren<{open:boolean;onOpenChange:(open:boolean)=>void;title:string;description?:string;snap?:number}>){
 const {root,height}=useNative(),start=useRef<number|null>(null);
 useEffect(()=>{if(open)dismissKeyboard();},[open]);
 return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal container={root.current}><Dialog.Overlay className="sheet-overlay native-sheet-overlay"/><Dialog.Content className="bottom-sheet native-sheet" data-testid="bottom-sheet" style={{maxHeight:Math.min(height-12,height*snap)}} aria-describedby={undefined} onOpenAutoFocus={event=>event.preventDefault()}>
  <div className="sheet-handle-zone" onPointerDown={event=>{start.current=event.clientY;event.currentTarget.setPointerCapture(event.pointerId);}} onPointerUp={event=>{if(start.current!==null&&event.clientY-start.current>75)onOpenChange(false);start.current=null;}} onPointerCancel={()=>{start.current=null;}}><div className="sheet-handle"/></div>
  <div className="sheet-header"><Dialog.Title className="sheet-title">{title}</Dialog.Title>{description&&<Dialog.Description className="sheet-description">{description}</Dialog.Description>}</div><div className="sheet-content">{children}</div>
 </Dialog.Content></Dialog.Portal></Dialog.Root>;
}

export function KeyboardTextarea(props:TextareaHTMLAttributes<HTMLTextAreaElement>&{ref?:Ref<HTMLTextAreaElement>}){return <textarea {...props}/>;}
