export type QuoteItem = {order_item_id:number;snapshot_name:string;snapshot_unit:string;snapshot_rate:number;quantity:number;tolerance_kg:number};
export type DemoQuote = {id:string;version:number;state:string;base_total:number;max_weight_total:number;content_hash:string;tolerance_consent:boolean;is_amendment:boolean;items:QuoteItem[];approvals:{method:string;verification_state:string}[]};
export type DemoBag = {id:string;tag_id:string;service_group:string;item_count:number;intake_condition:string;custody_state:string;qc_completed:boolean;items:{id:string;tag_id:string;description:string;condition:string}[]};
export type DemoWorkspaceData = {
 currentItems?:{order_item_id:number;actual_qty:number;rate:number;line_total:number}[];
 order:{id:string;revision:number;status:string;total:number;active_quote_id:string;active_settlement_id:string|null;work_quote_id?:string|null;qc_quote_id?:string|null};eligible:boolean;
 quotes:DemoQuote[];bags:DemoBag[];settlements:{id:string;version:number;total:number;reason:string;created_at:string}[];
 charges:{id:string;signed_amount:number;reason:string}[];issues:{id:string;type:string;state:string;blocking:boolean;remedy:string|null}[];
 custody:{id:string;kind:string;bag_id:string|null;flagged_item_id:string|null;replaced_tag_id:string|null;created_at:string}[];
 money?:{settlement_total:number|null;net_received:number;balance:number|null;status:string;entries:{id:string;kind:string;amount:number;signed_effect:number;method:string;original_id:string|null;effective_at:string;correction_reason:string|null}[]};
};
