import {dsvFormat} from 'd3-dsv';

const csv = dsvFormat(',');

const RE_LAT = /(\d{2})(\d{2}\.\d{3})([NS])/;
const RE_LON = /(\d{3})(\d{2}\.\d{3})([EW])/;
const RE_VDIS = /(\d+(?:\.\d+)?)(m|ft)/i;
const RE_HDIS = /(\d+(?:\.\d+)?)(km|ml|nm|m)/i;
const RE_DURATION = /(?:(?:(\d+):)?(\d+):)?(\d{2})/;

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
    let elevation = row[5] ? parseVDistance(row[5], 'elevation') : null;
    let style = parseWaypointStyle(row[6]);
    let runwayDirection = row[7] ? Number(row[7]) : null;
    let runwayLength = row[8] ? parseHDistance(row[8], 'runway length') : null;
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

function parseHDistance(str: string | undefined, description: string): parse.HDistance {
  if (!str) throw new Error(`Invalid ${description}: ${str}`);

  let match = str.match(RE_HDIS);
  if (!match) throw new Error(`Invalid ${description}: ${str}`);

  let value = Number(match[1]);
  let unit = match[2].toLowerCase() as ('m' | 'km' | 'nm' | 'ml');

  return { value, unit };
}

function parseVDistance(str: string | undefined, description: string): parse.VDistance {
  if (!str) throw new Error(`Invalid ${description}: ${str}`);

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

function parseTasks(str: string): parse.Task[] {
  if (!str) return [];

  let rows = csv.parseRows(str);
  let tasks: parse.Task[] = [];
  for (let row of rows) {
    if (row[0] === 'Options') {
      let lastTask = tasks[tasks.length - 1];
      if (!lastTask) throw new Error(`Missing task for "Options" line`);

      lastTask.options = parseTaskOptions(row);

    } else if (row[0].indexOf('ObsZone=') === 0) {
      let lastTask = tasks[tasks.length - 1];
      if (!lastTask) throw new Error(`Missing task for "ObsZone" line`);

      let pointIndex = Number(row[0].slice(8));
      let point = lastTask.points[pointIndex];
      if (!point) throw new Error(`Missing point for "ObsZone" line`);

      point.options = parseTaskpointOptions(row);

    } else {
      let description = row[0] || '';
      let names = row.slice(1).filter(Boolean);
      if (names.length === 0) continue;

      let points = names.map(name => ({ name } as parse.Taskpoint));

      tasks.push({ description, points, options: {} });
    }
  }

  return tasks;
}

function parseTaskOptions(columns: string[]): parse.TaskOptions {
  let options: parse.TaskOptions = {};

  for (let column of columns) {
    let [name, value] = column.split('=');
    if (name === 'NoStart') {
      options.noStart = value;

    } else if (name === 'TaskTime') {
      options.taskTime = parse.parseDuration(value);

    } else if (name === 'WpDis') {
      options.wpDis = parse.parseBoolean(value);

    } else if (name === 'NearDis') {
      options.nearDis = parseHDistance(value, name);

    } else if (name === 'NearAlt') {
      options.nearAlt = parseVDistance(value, name);

    } else if (name === 'MinDis') {
      options.minDis = parse.parseBoolean(value);

    } else if (name === 'RandomOrder') {
      options.randomOrder = parse.parseBoolean(value);

    } else if (name === 'MaxPts') {
      options.maxPts = Number(value);

    } else if (name === 'BeforePts') {
      options.beforePts = Number(value);

    } else if (name === 'AfterPts') {
      options.afterPts = Number(value);

    } else if (name === 'Bonus') {
      options.bonus = Number(value);
    }
  }

  return options;
}

function parseTaskpointOptions(columns: string[]): parse.TaskpointOptions {
  let options: parse.TaskpointOptions = { line: false };

  for (let column of columns) {
    let [name, value] = column.split('=');
    if (name === 'Style' && value) {
      let style = Number(value);
      if (style >= 0 && style <= 4) {
        options.style = style;
      }

    } else if (name === 'R1') {
      let r1 = parseHDistance(value, 'R1');
      if (!r1) throw new Error(`Invalid ${name}: ${value}`);
      options.r1 = r1;

    } else if (name === 'A1') {
      let num = Number(value);
      if (isNaN(num)) throw new Error(`Invalid ${name}: ${value}`);
      options.a12 = num;

    } else if (name === 'R2') {
      let r2 = parseHDistance(value, 'R2');
      if (!r2) throw new Error(`Invalid ${name}: ${value}`);
      options.r2 = r2;

    } else if (name === 'A2') {
      let num = Number(value);
      if (isNaN(num)) throw new Error(`Invalid ${name}: ${value}`);
      options.a12 = num;

    } else if (name === 'A12') {
      let num = Number(value);
      if (isNaN(num)) throw new Error(`Invalid ${name}: ${value}`);
      options.a12 = num;

    } else if (name === 'Line' && value === '1') {
      options.line = true;
    }
  }

  return options;
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
    description: string;
    points: Taskpoint[];
    options: TaskOptions;
  }

  export interface Taskpoint {
    name: string;
    options?: TaskpointOptions;
  }

  export interface TaskpointOptions {
    style?: TaskpointStyle;
    r1?: HDistance;
    a1?: number;
    r2?: HDistance;
    a2?: number;
    a12?: number;
    line: boolean;
  }

  export enum TaskpointStyle {
    FixedValue = 0,
    Symmetrical = 1,
    ToNextPoint = 2,
    ToPreviousPoint = 3,
    ToStartPoint = 4,
  }

  export interface TaskOptions {
    /** Opening of start line */
    noStart?: string;

    /** Designated Time for the task (seconds) */
    taskTime?: number;

    /** Task distance calculation. False = use fixes, True = use waypoints */
    wpDis?: boolean;

    /** Distance tolerance */
    nearDis?: HDistance;

    /** Altitude tolerance */
    nearAlt?: VDistance;

    /** Uncompleted leg. False = calculate maximum distance from last observation zone. */
    minDis?: boolean;

    /** if true, then Random order of waypoints is checked */
    randomOrder?: boolean;

    /** Maximum number of points */
    maxPts?: number;

    /**
     * Number of mandatory waypoints at the beginning.
     * 1 means start line only, two means start line plus first point in task sequence (Task line).
     */
    beforePts?: number;

    /**
     * Number of mandatory waypoints at the end.
     * 1 means finish line only, two means finish line and one point before finish in task sequence (Task line).
     */
    afterPts?: number;

    /** Bonus for crossing the finish line */
    bonus?: number;
  }

  export function parseDuration(str: string | undefined, description: string = 'duration'): number {
    if (!str) throw new Error(`Invalid ${description}: ${str}`);

    let match = str.match(RE_DURATION);
    if (!match) throw new Error(`Invalid ${description}: ${str}`);

    let h = match[1] ? Number(match[1]) : 0;
    let m = match[2] ? Number(match[2]) : 0;
    let s = Number(match[3]);

    return (h * 60 + m) * 60 + s;
  }

  export function parseBoolean(str: string | undefined, description: string = 'boolean'): boolean {
    if (!str) throw new Error(`Invalid ${description}: ${str}`);

    let value = str.toLowerCase().trim();
    if (value === 'true') {
      return true;
    } else if (value === 'false') {
      return false;
    } else {
      throw new Error(`Invalid ${description}: ${str}`);
    }
  }
}

export = parse;
