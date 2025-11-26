export interface PersonaAppearance {
  prompt?: string;
  description?: string;
  height?: string;
  build?: string;
  hairColor?: string;
  hairStyle?: string;
  eyeColor?: string;
  facialFeatures?: string;
  clothingStyle?: string;
  typicalOutfit?: string;
  accessories?: string[];
  bodyLanguage?: string;
  firstImpression?: string;
}

export interface PersonaOutfit {
  name: string;
  occasion: string;
  season?: string;
  description: string;
  items: {
    head?: string;
    top: string;
    bottom: string;
    shoes: string;
    outerwear?: string;
    accessories?: string[];
  };
  colors: string[];
  style: string;
  impression: string;
}

export interface PersonaDemographics {
  age?: number | string;
  gender?: string;
  location?: string;
  education?: string;
  income?: string;
  familyStatus?: string;
}

export interface PersonaProfessional {
  jobTitle?: string;
  company?: string;
  companySize?: string;
  industry?: string;
  experience?: string;
  responsibilities?: string[];
  teamSize?: string;
}

export interface PersonaData {
  name: string;
  title?: string;
  avatar?: string;
  appearance?: PersonaAppearance;
  outfits?: PersonaOutfit[];
  demographics?: PersonaDemographics;
  professional?: PersonaProfessional;
  lang?: string;
}

export interface GenerateImagesRequest {
  personaId?: string;
  personaData?: PersonaData;
  prompt?: string;
  style?: 'portrait' | 'professional' | 'casual' | 'lifestyle';
  count?: number;
}

export interface GenerateImagesResponse {
  success: boolean;
  images?: string[];
  error?: string;
}