from glob import glob
import json

data = {}
for g in glob('*.json'):
    with open(g, 'r') as f:
        dat = json.load(f)
        data[dat['id']] = dat

for subj in data:
    # 
    dat = data[subj]
    print('-----------')
    print(f'ID: {subj}')
    print(f'first visit: {dat["config"]["first_visit"]}')
    print(f'Approx time (min): {(dat["logs"][-1]["windowTime"] - dat["logs"][0]["windowTime"])/1000/60}')
    print(f'total reward: {dat["totalReward"]} vs bonuses: {dat["bonusValues"]}')
    td = dat["trialData"]
    print(f'Letter A chosen {sum(t["value"] == "A" for t in td)}')
    print(f'Instructions met: {dat["instructCorrect"]} out of {dat["instructCount"]}')
