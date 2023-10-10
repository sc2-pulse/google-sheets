# google-sheets
This library allows you to import data from the [SC2 Pulse](https://github.com/sc2-pulse/sc2-pulse) API into Google Sheets.

![sc2pulse-google-sheets](https://user-images.githubusercontent.com/63394805/221893541-f78f2cea-978f-450d-ae17-d2b52f916854.png)

## Locale
This library only works with English locales. Set any English(United States, United Kingdom, etc.) locale in your 
sheet settings under File->Settings->Locale menu.

## Add the SC2Pulse library to your sheet
* Sheets menu->Extensions->Apps Script
* Copy the script
* Alternativaly, you can Libraries(+)->Add a library, script id `10zJF-kY_ODbhzLlYztV2Ju_nH9PGftxnUOThYRDmshBj62w0DqtjrxWT`. This allows you to use built-in versioning system, but you will have to redefine function signatures and call the lib from there.

## Define functions
This section describes how to define functions if you are using the lib by id rather than copying it. You can't call library functions directly from your sheets, so you have to redefine required functions in Apps Script and call the lib there.

Add the following code in the Apps Script editor
```js
function summary1v1(characterIds, depth, sortBy = "rating_last") {
  return SC2Pulse.summary1v1(characterIds, depth, sortBy);
}

function summary1v1Clan(tag, region, depth, sortBy = "rating_last") {
  return SC2Pulse.summary1v1Clan(tag, region, depth, sortBy);
}
```

## Import data from SC2 Pulse
Now you can use library functions as regular functions in your sheets.

### summary1v1
`=summary1v1(characterIds, depth, sortBy)`
* `characterIds` Character ids. Int array. Can be found in URL, for example `https://www.nephest.com/sc2/?type=character&id=236695&m=1#player-stats-mmr`, copy the `id` parameter, in this case the id is `236695`.
* `depth` Summary depth, days. Integer. Max value: 120.
* `sortBy`Sorting options, descending order. Case insensitive. String.
    * `PLAYER_CHARACTER_ID`
    * `GAMES`
    * `RATING_MAX`
    * `RATING_AVG`
    * `RATING_LAST`

Example: `=summary1v1({236695, 2918753}, 60)`

### summary1v1Clan
`=summary1v1Clan(tag, region, depth, sortBy)`
* `tag` Clan tag. Case sensitive. String.
* `region` Clan region. Case insensitive. String.
    * `EU`
    * `US`
    * `KR`
    * `CN`
* `depth` Summary depth, days. Integer. Max value: 120.
* `sortBy`Sorting options, descending order. Case insensitive. String.
    * `PLAYER_CHARACTER_ID`
    * `GAMES`
    * `RATING_MAX`
    * `RATING_AVG`
    * `RATING_LAST`

Example: `=summary1v1Clan("Heroes", "EU", 30, "games")`

## Misc
* [COUNTIF](https://support.google.com/docs/answer/3093480)
* [Conditional formatting](https://support.google.com/docs/answer/78413)
* Live example: https://docs.google.com/spreadsheets/d/15SRUDoxjLclBZMY-TZs_yUnZnI9M4-ZesXhf_BEE66E/edit#gid=0
* Google sets quotas for Apps Script libraries, so it may take up to 10 seconds to load the data. The delay is on Google's side.
