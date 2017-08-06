import {dsvFormat} from 'd3-dsv';

const csv = dsvFormat(',');

const RE_LAT = /(\d{2})(\d{2}\.\d{3})([NS])/;
const RE_LON = /(\d{3})(\d{2}\.\d{3})([EW])/;
const RE_VDIS = /(\d+(?:\.\d+)?)(m|ft)/i;
const RE_HDIS = /(\d+(?:\.\d+)?)(km|ml|nm|m)/i;

function parse(str: string): parse.CUPFile {
  let [waypointPart, taskPart] = str.split('-----Related Tasks-----');

  let waypoints = parseWaypoints(waypointPart);
  let tasks = parseTasks(taskPart);

  return { waypoints, tasks };
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
    let elevation = parseVDistance(row[5], 'elevation');
    let style = parseWaypointStyle(row[6]);
    let runwayDirection = row[7] ? Number(row[7]) : null;
    let runwayLength = parseHDistance(row[8], 'runway length');
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

function parseHDistance(str: string | undefined, description: string): parse.HDistance | null {
  if (!str) return null;

  let match = str.match(RE_HDIS);
  if (!match) throw new Error(`Invalid ${description}: ${str}`);

  let value = Number(match[1]);
  let unit = match[2].toLowerCase() as ('m' | 'km' | 'nm' | 'ml');

  return { value, unit };
}

function parseVDistance(str: string | undefined, description: string): parse.VDistance | null {
  if (!str) return null;

  let match = str.match(RE_VDIS);
  if (!match) throw new Error(`Invalid ${description}: ${str}`);

  let value = Number(match[1]);
  let unit = match[2].toLowerCase() as ('m' | 'ft');

  return { value, unit };
}

function parseWaypointStyle(str: string | undefined): parse.WaypointStyle {
  if (!str) return parse.WaypointStyle.Unknown;

  let value = Number(str);
  return value < 1 || value > 17 ? parse.WaypointStyle.Unknown : value;
}

function parseTasks(src: string): parse.Task[] {
  return [];
}

namespace parse {
  export interface CUPFile {
    waypoints: Waypoint[];
    tasks: Task[];
  }

  export interface Waypoint {
    name: string;
    code: string;
    country: string;
    latitude: number;
    longitude: number;
    elevation: VDistance | null;
    style: WaypointStyle;
    runwayDirection: number | null;
    runwayLength: HDistance | null;
    frequency: string | null;
    description: string;
  }

  export interface HDistance {
    value: number;
    unit: 'm' | 'km' | 'nm' | 'ml';
  }

  export interface VDistance {
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

  export interface Task {

  }
}

export = parse;
