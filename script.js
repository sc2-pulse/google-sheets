//Copyright (C) 2022-2023 Oleksandr Masniuk
//SPDX-License-Identifier: MIT-0

const URL_ROOT = "https://sc2pulse.nephest.com/sc2";
const API_ROOT = URL_ROOT + "/api";

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
  for(let from = 0; from < ids.length;) {
    const to = Math.min(from + 50, ids.length);
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
