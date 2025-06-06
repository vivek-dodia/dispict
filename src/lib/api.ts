// See main.py for the source of this type.
export type Artwork = {
  id: number;
  objectnumber: string;
  url: string;
  image_url: string;

  dimensions: string;
  dimheight: number;
  dimwidth: number;

  title: string | null;
  description: string | null;
  labeltext: string | null;
  people: string[];
  dated: string;
  datebegin: number;
  dateend: number;
  century: string | null;

  department: string;
  division: string | null;
  culture: string | null;
  classification: string;
  technique: string | null;
  medium: string | null;

  accessionyear: number | null;
  verificationlevel: number;
  totaluniquepageviews: number;
  totalpageviews: number;

  copyright: string | null;
  creditline: string;
};

// TODO: Simplify this type later if needed.
export type Artwork = {
  id: number;
  objectnumber: string;
  url: string;
  image_url: string;

  dimensions: string;
  dimheight: number;
  dimwidth: number;

  title: string | null;
  description: string | null;
  labeltext: string | null;
  people: string[];
  dated: string;
  datebegin: number;
  dateend: number;
  century: string | null;

  department: string;
  division: string | null;
  culture: string | null;
  classification: string;
  technique: string | null;
  medium: string | null;

  accessionyear: number | null;
  verificationlevel: number;
  totaluniquepageviews: number;
  totalpageviews: number;

  copyright: string | null;
  creditline: string;
};

export async function loadLocalImages(): Promise<Artwork[]> {
  const response = await fetch("/photos/metadata.json");
  const data = await response.json();
  return data as Artwork[];
}
