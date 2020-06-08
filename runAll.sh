#!/bin/bash

# importing config
config=`cat config.sh`
$config

for (( i=0; i < roomsCount; ++i )); do
    playersCount=$((RANDOM * (2 * playersCountDleta + 1) / 32767 - playersCountDleta + playersCountAv))
    key=`wget -qO- https://m20-sch57.site:3005/api/getFreeKey | sed -E "s/\{.*\":\"//g" | sed -E "s/\".//g"`
    for (( j=0; j < playersCount; ++j )); do
        echo $key $playersCount $j
    done
done
