//Copyright (C) 2022-2023 Oleksandr Masniuk
//SPDX-License-Identifier: MIT-0

const URL_ROOT = "https://sc2pulse.nephest.com/sc2";
const API_ROOT = URL_ROOT + "/api";
const DEPTH_MAX = 120;
const DEPTH_UNLIMITED_BATCH_SIZE = 1;
const BATCH_SIZE = 50;

const Region = Object.freeze({
  US: {code:1, name: "us", fullName: "US", order: 1},
  EU: {code:2, name: "eu", fullName: "EU", order: 2},
  KR: {code:3, name: "kr", fullName: "KR", order: 3},
  CN: {code:5, name: "cn", fullName: "CN", order: 4}
});

const Race = Object.freeze({
  TERRAN: {code: 1, name: "terran", fullName: "TERRAN", order: 1},
  PROTOSS: {code: 2, name: "protoss", fullName: "PROTOSS", order: 2},
  ZERG: {code: 3, name: "zerg", fullName: "ZERG", order: 3},
  RANDOM: {code: 4, name: "random", fullName: "RANDOM", order: 4}
});

const League = Object.freeze({
  BRONZE: {code:0, name: "bronze", shortName: "bro", fullName: "BRONZE", order: 1},
  SILVER: {code:1, name: "silver", shortName: "sil", fullName: "SILVER", order: 2},
  GOLD: {code:2, name: "gold", shortName: "gol", fullName: "GOLD", order: 3},
  PLATINUM: {code:3, name: "platinum", shortName: "pla", fullName: "PLATINUM", order: 4},
  DIAMOND: {code:4, name: "diamond", shortName: "dia", fullName: "DIAMOND", order: 5},
  MASTER: {code:5, name: "master", shortName: "mas", fullName: "MASTER", order: 6},
  GRANDMASTER: {code:6, name: "grandmaster", shortName: "gra", fullName: "GRANDMASTER", order: 7}
});

const LeagueTier = Object.freeze({
  FIRST: {code: 0, name: "1", fullName: "FIRST", order: 1},
  SECOND: {code: 1, name: "2", fullName: "SECOND", order: 2},
  THIRD: {code: 2, name: "3", fullName: "THIRD", order: 3}
});

const TeamFormat = Object.freeze({
  _1V1: {code:201, name: "1V1", fullName: "LOTV_1V1", formatName: "_1V1", memberCount: 1, order: 1},
  _2V2: {code:202, name: "2V2", fullName: "LOTV_2V2", formatName: "_2V2", memberCount: 2, order: 2},
  _3V3: {code:203, name: "3V3", fullName: "LOTV_3V3", formatName: "_3V3", memberCount: 3, order: 3},
  _4V4: {code:204, name: "4V4", fullName: "LOTV_4V4", formatName: "_4V4", memberCount: 4, order: 4},
  ARCHON: {code:206, name: "Archon", fullName: "LOTV_ARCHON", formatName: "ARCHON", memberCount: 2, order: 5}
});

const TeamFormatType = Object.freeze({
  _1V1: {name: "1V1", fullName: "_1V1", teamFormats: [TeamFormat._1V1], order: 1},
  TEAM: {name: "Team", fullName: "TEAM", teamFormats: Object.values(TeamFormat).filter(f=>f.memberCount > 1), order: 2}
});

const TeamType = Object.freeze({
  ARRANGED: {code:0, name: "Arranged", fullName: "ARRANGED", secondaryName: "Team", order: 1},
  RANDOM: {code:1, name: "Random", fullName: "RANDOM", secondaryName: "Solo", order: 2}
});

/**
 * @param {number} id
 * @param {object} enumObj
 * @return {object} enum object with provided id
 */
function enumOfId(id, enumObj, throwError = true)
{
  for(const curEnum of Object.values(enumObj)) if(curEnum.code == id) return curEnum;
  if(throwError) throw new Error("Invalid id: " + id);
  return null;
}

/**
 * @param {string} name
 * @param {object} enumObj
 * @return {object} enum object with provided name
 */
function enumOfName(name, enumObj, throwError = true){
  name = name.toLowerCase();
  for(const curEnum of Object.values(enumObj)) if(curEnum.name.toLowerCase() == name) return curEnum;
  if(throwError) throw new Error("Invalid name: " + name);
  return null;
}

/**
 * @param {string} fullName
 * @param {object} enumObj
 * @return {object} enum object with provided fullName
 */
function enumOfFullName(fullName, enumObj, throwError = true){
  fullName = fullName.toLowerCase();
  for(const curEnum of Object.values(enumObj)) if(curEnum.fullName.toLowerCase() == fullName) return curEnum;
  if(throwError) throw new Error("Invalid full name: " + fullName);
  return null;
}

/**
 * @param {number[]} characterIds
 * @param {number} depth summary depth(days)
 * @param {string} sortBy property name
 * @return {string[][]} 2d string array, suitable for table
 */
function summary1v1(characterIds, depth, sortBy = "rating_last") {
  if(!Array.isArray(characterIds)) characterIds = Array.of(characterIds);
  const result = [];
  const summary = getSummaries(characterIds, depth);
  summary.sort(getSummarySort(sortBy));
  const characters = getCharacterMap(summary.map(s=>s.playerCharacterId));
  result.push(['Name', 'Race', 'Games', 'Last MMR', 'Avg MMR', 'Max MMR', 'Pulse link']);
  for(entry of summary) {
    const pChar = characters.get(entry.playerCharacterId);
    result.push([getCharacterName(pChar.name), entry.race.toLowerCase(), entry.games, entry.ratingLast, entry.ratingAvg, entry.ratingMax, getCharacterLink(pChar.id)]);
  }
  return result;
}

/**
 * @param {string} tag
 * @param {string} region
 * @param {number} depth summary depth(days)
 * @param {string} sortBy property name
 * @return {string[][]} 2d string array, suitable for table
 */
function summary1v1Clan(tag, region, depth, sortBy = "rating_last") {
  const result = [];
  const searchUrl = `${API_ROOT}/character/search?term=${encodeURIComponent('[' + tag + ']')}`;
  const players = fetchJson(searchUrl)
    .filter(c=>c.members.character.region.toLowerCase() == region.toLowerCase());
  const playersMap = toMap(players, p=>p.members.character.id);
  const summary = getSummaries(Array.from(playersMap.keys()), depth);
  summary.sort(getSummarySort(sortBy));
  result.push(['Name', 'Race', 'Games', 'Last MMR', 'Avg MMR', 'Max MMR', 'Pulse link']);
  for(entry of summary) {
    const pChar = playersMap.get(entry.playerCharacterId).members.character;
    result.push([getCharacterName(pChar.name), entry.race.toLowerCase(), entry.games, entry.ratingLast, entry.ratingAvg, entry.ratingMax, getCharacterLink(pChar.id)]);
  }
  return result;
}

function getSummarySort(sortBy){
  sortBy = snakeCaseToCamelCase(sortBy.trim().toLowerCase().replace(/\s+/, "_"));
  return (a, b)=>b[sortBy] - a[sortBy];
}

/**
 * @param {string} name Character name
 * @return {string} trimmed name
 */
function getCharacterName(name){
  return name.substring(0, name.indexOf("#"));
}

/**
 * @param {number} id Character id
 * @return {string} character URL
 */
function getCharacterLink(id){
  return `${URL_ROOT}/?type=character&id=${encodeURIComponent(id)}&m=1#player-stats-mmr`;
}

function fetchJson(url)
{
  return JSON.parse(UrlFetchApp.fetch(url).getContentText());
}

function toMap(items, keyMapper, valueMapper=(item)=>item) {
  const map = new Map();
  items.forEach((item) =>{
    map.set(keyMapper(item), valueMapper(item));
  });
  return map;
}

function snakeCaseToCamelCase(str){
  return str.toLowerCase().replace(/([_][a-z])/g, group=>group.toUpperCase().replace('_', ''));
}

/**
 * Fetches 1v1 summaries in batches of 50 character ids.
 *
 * @param {number[]} ids Character ids
 * @param {number} depth summary depth(days)
 * @return {object[]} summary array
 */
function getSummaries(ids, depth){
  let result = [];
  const batchSize = depth > DEPTH_MAX ? DEPTH_UNLIMITED_BATCH_SIZE : BATCH_SIZE;
  for(let from = 0; from < ids.length;) {
    const to = Math.min(from + batchSize, ids.length);
    const batch = ids.slice(from, to);
    const summaryUrl = `${API_ROOT}/character/${encodeURIComponent(batch.join(","))}/summary/1v1/${encodeURIComponent(depth)}`;
    result = result.concat(fetchJson(summaryUrl));
    from = to;
  }
  return result;
}

/**
 * @param {number[]} ids Character ids
 * @return {object[]} Character array
 */
function getCharacters(ids){
  return fetchJson(`${API_ROOT}/character/${encodeURIComponent(ids.join(","))}`);
}

/**
 * @param {number[]} ids Character ids
 * @return {object} Character map, mapped by id
 */
function getCharacterMap(ids){
  return toMap(getCharacters(ids), c=>c.id);
}

/**
 * @param {object} cursor
 * @param {number} season - season id
 * @param {object[]} [regions] - region filter
 * @param {object[]} [leagues] - league filter
 * @returns {object} pulled API JSON result
 */
function getLadder(cursor, season, regions = Object.values(Region), leagues = Object.values(League)){
  let url = `${API_ROOT}/ladder/a/${encodeURIComponent(cursor.rating)}/${encodeURIComponent(cursor.id)}/1\
?season=${encodeURIComponent(season)}\
&queue=${TeamFormat._1V1.fullName}\
&team-type=${TeamType.ARRANGED.fullName}\
&page=1`;
  for(const region of regions) url += "&" + region.name + "=true";
  for(const league of leagues) url += "&" + league.shortName + "=true";
  return fetchJson(url);
}

function getSeasons(){
  return fetchJson(`${API_ROOT}/season/list/all`);
}

/**
 * @param {number} count - team count
 * @param {number} season - season id
 * @param {object[]} [regions] - region filter
 * @param {object[]} [leagues] - league filter
 * @param {number} [ratingStart=10000]
 * @returns {object[]} extracted teams
 */
function getLadderTeams(count, season, regions = Object.values(Region), leagues = Object.values(League), ratingStart = 10000) {
  let teams = [];
  let cursor = {rating: ratingStart + 1, id: 1};
  while(teams.length < count){
    const curPage = getLadder(cursor, season, regions, leagues).result;
    if(curPage.length == 0) break;

    teams = teams.concat(curPage);
    cursor = teams[teams.length - 1];
  }
  if(teams.length > count) teams = teams.slice(0, count);
  return teams;
}

function getFavoriteRace(member)
{
  return Object.values(Race)
    .map(race=>[race, member[race.name + "GamesPlayed"] || 0])
    .sort((a, b)=>b[1] - a[1])[0][0];
}


function revealTeamMember(member){
  return member.proNickname || getCharacterName(member.character.name);
}

/**
 * @param {Object} team
 * @param {boolean} [reveal = false] - reveal player names when possible
 * @returns {string[]} rendered team
 */
function renderTeam(team, reveal = false) {
  return [
    reveal ? revealTeamMember(team.members[0]) : getCharacterName(team.members[0].character.name),
    getFavoriteRace(team.members[0]).name,
    team.rating,
    team.wins,
    team.losses,
    team.region,
    enumOfId(team.league.type, League).name,
    team.tierType != null ? team.tierType + 1 : "",
    getCharacterLink(team.members[0].character.id)];
}

/**
 * @param {number} count - number of ladder teams to pull
 * @param {object[]} [regions] - region filter
 * @param {object[]} [leagues] - league filter
 * @param {number} [ratingStart=10000]
 * @param {boolean} [reveal=false] - reveal player names when possible
 * @param {number} [season] - season id, current season by default
 * @returns {string[][]} 2d string array suitable for sheets table
 */
function ladder(
  count,
  regions = null,
  leagues = null,
  ratingStart = null,
  reveal = null,
  season = null){
    if(!regions) regions = Object.values(Region).map(r=>r.name);
    if(!Array.isArray(regions)) regions = Array.of(regions);
    if(Array.isArray(regions[0])) regions = regions[0];
    regions = regions.map(r=>enumOfName(r, Region));

    if(!leagues) leagues = Array.from(Object.values(League)).map(l=>l.name);
    if(!Array.isArray(leagues)) leagues = Array.of(leagues);
    if(Array.isArray(leagues[0])) leagues = leagues[0];
    leagues = leagues.map(l=>enumOfName(l, League));

    if(!ratingStart) ratingStart = 10000;
    if(reveal === null) reveal = false;
    if(!season) season = getSeasons()[0].battlenetId;

    return [["Player", "Race", "MMR", "Wins", "Losses", "Region", "League", "Tier", "SC2Pulse link"]]
      .concat(getLadderTeams(count, season, regions, leagues, ratingStart)
        .map(team=>renderTeam(team, reveal)));
}
