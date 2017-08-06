import {dsvFormat} from 'd3-dsv';

const csv = dsvFormat(',');

const RE_LAT = /(\d{2})(\d{2}\.\d{3})([NS])/;
const RE_LON = /(\d{3})(\d{2}\.\d{3})([EW])/;
const RE_ELEV = /(\d+(?:\.\d+)?)(m|ft)/i;
const RE_RW_LEN = /(\d+(?:\.\d+)?)(ml?|nm)/i;

function parse(str: string): parse.CUPFile {
  let [waypointPart, taskPart] = str.split('-----Related Tasks-----');

  let waypoints = parseWaypoints(waypointPart);
  // let tasks = parseTasks(taskPart);

  return { waypoints };
}

function parseWaypoints(str: string): parse.Waypoint[] {
  return csv.parseRows(str, row => {
    if (row.length < 5) throw new Error(`Invalid waypoint: ${str}`);

    // ignore CSV header line
    if (row[2].toLowerCase() === 'country') return {};

    let name = row[0];
    let code = row[1] || '';
    let country = row[2] || '';
    let latitude = parseLatitude(row[3]);
    let longitude = parseLongitude(row[4]);
    let elevation = parseElevation(row[5]);
    let style = parseWaypointStyle(row[6]);
    let runwayDirection = row[7] ? Number(row[7]) : null;
    let runwayLength = parseRunwayLength(row[8]);
    let frequency = row[9] || null;
    let description = row[10] || '';

    return {
      name,
      code,
      country,
      latitude,
      longitude,
      elevation,
      style,
      runwayDirection,
      runwayLength,
      frequency,
      description,
    };
  }).filter(row => 'name' in row) as parse.Waypoint[];
}

function parseLatitude(str: string): number {
  let match = str.match(RE_LAT);
  if (!match) throw new Error(`Invalid latitude: ${str}`);

  let value = Number(match[1]) + Number(match[2]) / 60;
  return (match[3] === 'S') ? -value : value;
}

function parseLongitude(str: string): number {
  let match = str.match(RE_LON);
  if (!match) throw new Error(`Invalid longitude: ${str}`);

  let value = Number(match[1]) + Number(match[2]) / 60;
  return (match[3] === 'W') ? -value : value;
}

function parseElevation(str: string | undefined): parse.Elevation | null {
  if (!str) return null;

  let match = str.match(RE_ELEV);
  if (!match) throw new Error(`Invalid elevation: ${str}`);

  let value = Number(match[1]);
  let unit = match[2].toLowerCase() as ('m' | 'ft');

  return { value, unit };
}

function parseWaypointStyle(str: string | undefined): parse.WaypointStyle {
  if (!str) return parse.WaypointStyle.Unknown;

  let value = Number(str);
  return value < 1 || value > 17 ? parse.WaypointStyle.Unknown : value;
}

function parseRunwayLength(str: string | undefined): parse.RunwayLength | null {
  if (!str) return null;

  let match = str.match(RE_RW_LEN);
  if (!match) throw new Error(`Invalid runway length: ${str}`);

  let value = Number(match[1]);
  let unit = match[2].toLowerCase() as ('m' | 'nm' | 'ml');

  return { value, unit };
}

namespace parse {
  export interface CUPFile {
    waypoints: Waypoint[];
    // tasks: Task[];
  }

  export interface Waypoint {
    name: string;
    code: string;
    country: string;
    latitude: number;
    longitude: number;
    elevation: Elevation | null;
    style: WaypointStyle;
    runwayDirection: number | null;
    runwayLength: RunwayLength;
    frequency: string | null;
    description: string;
  }

  export interface Elevation {
    value: number;
    unit: 'm' | 'ft';
  }

  export enum WaypointStyle {
    Unknown = 0,
    Normal = 1,
    AirfieldGrass = 2,
    Outlanding = 3,
    GliderSite = 4,
    AirfieldSolid = 5,
    MtPass = 6,
    MtTop = 7,
    Sender = 8,
    Vor = 9,
    Ndb = 10,
    CoolTower = 11,
    Dam = 12,
    Tunnel = 13,
    Bridge = 14,
    PowerPlant = 15,
    Castle = 16,
    Intersection = 17,
  }

  export interface RunwayLength {
    value: number;
    unit: 'm' | 'nm' | 'ml';
  }
}

export = parse;
