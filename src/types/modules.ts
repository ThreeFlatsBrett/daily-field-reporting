export interface TimeLogEntry {
  activity: string;
  fromDepth?: number;
  toDepth?: number;
  startTime: string;
  endTime: string;
  hours: number;
  vendor?: string;
  notes?: string;
}

export interface Personnel {
  company: string;
  role: string;
  count: number;
}

export interface BitRecord {
  bitNumber: number;
  manufacturer: string;
  size: number;
  type: string;
  depthIn: number;
  depthOut: number;
  footage: number;
}

export interface MudReport {
  weight: number;
  viscosity: number;
  fluidLoss: number;
  ph: number;
  chlorides?: number;
}

export interface DrillingModuleData {
  timeLog: TimeLogEntry[];
  bitRecord?: BitRecord;
  mudReport?: MudReport;
  personnel?: Personnel[];
}

export interface CompletionStage {
  stageNumber: number;
  perforationTop: number;
  perforationBottom: number;
  fluidVolume: number;
  sandVolume: number;
  maxTreatPressure: number;
  avgRate: number;
}

export interface CompletionsModuleData {
  timeLog: TimeLogEntry[];
  completionStage?: CompletionStage;
  personnel?: Personnel[];
}

export interface EarthworkSummary {
  cutVolume: number;
  fillVolume: number;
  acreageCleared: number;
}

export interface LocationConstructionModuleData {
  timeLog: TimeLogEntry[];
  earthworkSummary?: EarthworkSummary;
  personnel?: Personnel[];
}

export interface WorkoverModuleData {
  timeLog: TimeLogEntry[];
  reasonForWorkover?: string;
  personnel?: Personnel[];
}

export interface ReCompletionsModuleData {
  timeLog: TimeLogEntry[];
  reasonForRecompletion?: string;
  personnel?: Personnel[];
}

export interface EquipmentInstalled {
  description: string;
  vendor: string;
  serialNumber?: string;
}

export interface ProductionFacilitiesModuleData {
  timeLog: TimeLogEntry[];
  equipmentInstalled?: EquipmentInstalled[];
  personnel?: Personnel[];
}

export interface LogRun {
  toolName: string;
  vendor: string;
  depthFrom: number;
  depthTo: number;
}

export interface LoggingModuleData {
  timeLog: TimeLogEntry[];
  logsRun?: LogRun[];
  personnel?: Personnel[];
}

export type ArtificialLiftType =
  | "rod_pump"
  | "esp"
  | "gas_lift"
  | "plunger"
  | "other";

export interface ArtificialLiftModuleData {
  timeLog: TimeLogEntry[];
  liftType?: ArtificialLiftType;
  installationSummary?: string;
  personnel?: Personnel[];
}

export type ModuleData =
  | DrillingModuleData
  | CompletionsModuleData
  | LocationConstructionModuleData
  | WorkoverModuleData
  | ReCompletionsModuleData
  | ProductionFacilitiesModuleData
  | LoggingModuleData
  | ArtificialLiftModuleData;
