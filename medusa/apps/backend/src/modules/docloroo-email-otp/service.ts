import { createHmac, timingSafeEqual } from "node:crypto"
import { AbstractAuthModuleProvider, MedusaError } from "@medusajs/framework/utils"
import type { AuthenticationInput,AuthenticationResponse,AuthIdentityProviderService } from "@medusajs/framework/types"
export function otpProof(email:string,expires:number){const key=process.env.DOCLOROO_TRACKING_SECRET;if(!key||key.length<32)throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE,"OTP signing key is unavailable");return createHmac("sha256",key).update(`docloroo:verified-email:${email}:${expires}`).digest("hex")}
export default class EmailOtpProvider extends AbstractAuthModuleProvider {
  static identifier="email-otp"
  async authenticate(data:AuthenticationInput,identities:AuthIdentityProviderService):Promise<AuthenticationResponse>{
    const {email,proof}=data.body||{},expires=Number(data.body?.expires)
    if(typeof email!=="string"||typeof proof!=="string"||!/^\S+@\S+\.\S+$/.test(email)||!Number.isSafeInteger(expires)||expires<Date.now()||expires>Date.now()+15000)return {success:false,error:"Verified email proof required"}
    const expected=Buffer.from(otpProof(email,expires)),actual=Buffer.from(proof)
    if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return {success:false,error:"Verified email proof required"}
    try{return {success:true,authIdentity:await identities.retrieve({entity_id:email})}}
    catch(e){if((e as MedusaError).type!==MedusaError.Types.NOT_FOUND)throw e;return {success:true,authIdentity:await identities.create({entity_id:email,user_metadata:{email}})}}
  }
  async register(data:AuthenticationInput,identities:AuthIdentityProviderService){return this.authenticate(data,identities)}
}
