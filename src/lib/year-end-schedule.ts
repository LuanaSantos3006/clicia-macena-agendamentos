type DayConfig={day?:number;enabled?:boolean;start?:string;end?:string;breakStart?:string|null;breakEnd?:string|null};

export function yearEndSchedule(date:string,config:DayConfig|undefined):DayConfig|undefined{
  if(!config?.enabled)return config;
  if(!date.startsWith("2026-12-"))return config;
  const shortDay=date.slice(8,10);
  return {...config,start:"09:00",end:["24","31"].includes(shortDay)?"15:00":"19:00"};
}
