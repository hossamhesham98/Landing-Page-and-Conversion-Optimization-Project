import {MedusaService} from "@medusajs/framework/utils"
import {Review} from "./models/review"
import {MediaRecord} from "./models/media-record"
export default class SiteyfyModuleService extends MedusaService({Review,MediaRecord}){}
