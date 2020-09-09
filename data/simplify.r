library(RcppSimdJson)
library(data.table)
library(ggplot2)
setwd("~/actlab/heroku-mab/data")
filenames <- list.files(pattern='*.json')

dat_list <- list()
for (i in 1:length(filenames)) {
  dat <- fload(filenames[i])
  foob <- as.data.table(dat$trialData)
  for (row in 1:nrow(foob)) {
    foob[row, prob_A := probs[[1]][1]]
    foob[row, prob_L := probs[[1]][2]]
    foob[row, reward_A := rewards[[1]][1]]
    foob[row, reward_L := rewards[[1]][2]]
  }
  foob[, probs:=NULL]
  foob[, rewards:=NULL]
  foob[, rt := time - trial_reference_time]
  foob[, id := dat$id]
  foob[, trial:= 1:nrow(foob)]
  dat_list[[i]] <- foob
}

out <- rbindlist(dat_list)

out[, foo:=frollmean(value=='A', 11, algo='exact', align='center'), by='id']
out[, foob:=mean(value=='A'), by='trial']
out[, foob2:=frollmean(foob, 11, algo='exact', align='center')]
ggplot(out, aes(x = trial, y = prob_A)) + geom_line(aes(y = prob_A), size=1) +
  geom_point(aes(x = trial, y = as.integer(value=='A'), colour=reward > 0)) +
  geom_line(aes(y = foo), colour='red', width=1) + 
  facet_wrap(~id)
