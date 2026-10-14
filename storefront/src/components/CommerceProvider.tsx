"use client"
import React,{createContext,useContext,useEffect,useRef,useState} from "react"
import {commerce,emptyCart,type Cart,type Catalog} from "@/lib/commerce"
import type {Line} from "@/lib/shop"
type ContextValue={loaded:boolean;cart:Cart["lines"];totals:Cart["totals"];catalog:Catalog;busy:boolean;error:string;addLines:(lines:Line[])=>Promise<boolean>;buyNow:(lines:Line[])=>Promise<boolean>;buyCart:Cart;updateCart:(id:string,delta:number)=>Promise<void>;removeCart:(id:string)=>Promise<void>;drawer:boolean;setDrawer:(open:boolean)=>void;toast:string;notify:(text:string)=>void;refresh:()=>Promise<void>}
const Context=createContext<ContextValue|null>(null)
export function useShop(){const value=useContext(Context);if(!value)throw new Error("StoreProvider missing");return value}
export default function CommerceProvider({children}:{children:React.ReactNode}){
 const [state,setState]=useState<Cart>(emptyCart),[buyCart,setBuyCart]=useState<Cart>(emptyCart),[catalog,setCatalog]=useState<Catalog>({available:false,variants:[]}),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[drawer,setDrawer]=useState(false),[toast,setToast]=useState("")
 const inFlight=useRef(false)
 async function refresh(){try{const [cat,cart,buy]=await Promise.all([commerce<Catalog>("catalog"),commerce<Cart>("cart"),commerce<Cart>("cart?source=buy")]);setCatalog(cat);setState(cart);setBuyCart(buy);setError("")}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setLoaded(true)}}
 useEffect(()=>{void refresh()},[])
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(""),3200);return()=>clearTimeout(timer)},[toast])
 async function mutate(operation:string,data:unknown):Promise<boolean>{if(inFlight.current)return false;inFlight.current=true;setBusy(true);setError("");try{const cart=await commerce<Cart>(operation,data);if(operation==="buy")setBuyCart(cart);else setState(cart);return true}catch(e){const message=e instanceof Error?e.message:String(e);setError(message);setToast(message);await refresh();return false}finally{inFlight.current=false;setBusy(false)}}
 async function updateCart(id:string,delta:number){const line=state.lines.find(x=>x.id===id);if(!line)return;await mutate(line.qty+delta<=0?"remove":"update",{lineId:line.lineId,qty:line.qty+delta})}
 async function removeCart(id:string){const line=state.lines.find(x=>x.id===id);if(line)await mutate("remove",{lineId:line.lineId})}
 return <Context.Provider value={{loaded,cart:state.lines,totals:state.totals,catalog,busy,error,addLines:async lines=>{const ok=await mutate("add",{lines});if(ok)setToast("تمت الإضافة للسلة");return ok},buyNow:lines=>mutate("buy",{lines}),buyCart,updateCart,removeCart,drawer,setDrawer,toast,notify:setToast,refresh}}>{children}{toast&&<div className="v7-toast" role="status">{toast}</div>}</Context.Provider>
}
