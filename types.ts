export enum TabView {
  DATA = 'data',
  VISUAL = 'visual',
  FINANCE = 'finance',
}

export type Ring = [number, number][]; // [lng,lat]
export interface PropertyData {
  addressInput: string;
  resolvedAddress: string;
  erf?: string;
  portion?: string;
  suburb?: string;
  township?: string;
  farmAllot?: string;
  streetNumber?: string;
  streetName?: string;
  streetType?: string;
  docref?: string; // SG reference e.g. "SG 6814/1949"
  zoning: string;
  areaM2: number;
  rings: Ring[]; // first ring outer, holes ignored for now
  sewerRisk: boolean;
  sewerDetails: string[];
  confidence: number; // 0..1 parcel match confidence
}

export interface EnvelopeMetrics {
  buildableAreaM2: number;
  maxFootprintM2: number;
  maxGFAM2: number;
  suggestedFootprintM2?: number;
}


export interface ConstraintLayer {
  key: string;
  label: string;
  featureCount: number;
  layerName: string;
  layerId: number;
}

export interface SgExtract {
  keywords?: string[];
  servitudeMentions?: string[];
  distancesM?: number[];
  bearings?: { deg: number; mins: number; secs: number }[];
  snippet?: string;
}

export interface PlanningCompliance {
  status: 'ok' | 'review';
  flags: string[];
}

export interface PackPreview {
  jobId: string;
  property: PropertyData;
  constraints?: ConstraintLayer[];
  sg: {
    status: 'not_requested' | 'pending' | 'downloaded' | 'failed';
    docref?: string;
    message?: string;
    portalUrl: string;
    extracted?: SgExtract;
  };
  envelope: {
    setbackM: number;
    coverage: number; // 0..1
    far: number;
    heightFloors: number;
  };
  metrics: EnvelopeMetrics;
  compliance?: PlanningCompliance;
  notes: string[];
}
