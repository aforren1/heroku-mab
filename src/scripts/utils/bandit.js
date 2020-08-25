// Chris' paper (pg 19 https://www.biorxiv.org/content/10.1101/2020.01.15.906545v1.full.pdf)

// Chris was more thoughtful about frequency/amplitude/phase, AFAIK
// Frequency was chosen so that harmonics wouldn't overlap
// amplitude were proportional to 1/f so each individual sinusoid had similar peak velocity
// random phases to allow same freqs&amps without learning specific sequence

// Maurice & co (pg 14 https://www.nature.com/articles/s41593-020-0600-3.pdf)
// frequency was 1, 2, 4, 8, 16 (1 = 768 trials (entire exp), 16 = 48 trials)
// amplitude was fixed 10deg
// unclear if phase was fixed or what

/* Sam's MATLAB code
%% reward probability schedule %%
% sum-of-sines
% 4 pure sine wave components with amplitude=30
ntrials = 1000;
freq = [20 10 4 2];
amp = .30;
for k = 1:length(freq)
    dt = 1/ntrials;
    t = (0:dt:1-dt)';
    y(k,:) = amp * sin(2*pi*freq(k)*t);
end
prob_sched = sum(y); % prob of bandit one giving reward
plot(prob_sched / 2 + 0.5);
*/

// https://github.com/aforren1/2dof-tracking/blob/master/helpers.py#L21

export function generateProbs() {
  // using primes,
  // 1 Hz = nTrials (1 cycle)
  // 2 Hz = nTrials/2
  // 3 Hz = nTrials/3
  // ...
  const freqs = [2, 3, 5, 11, 17]
  //const trials = freqs.reduce((a, b) => a * b)
  const trials = 10
  //const baseAmp = 0.889 // max possible amplitude *just* shy of 1
  //const amps = freqs.map((x) => baseAmp / x)
  const amps = [0.2, 0.2, 0.2, 0.2, 0.2]
  // TODO: set with something seedable!
  // e.g. https://github.com/davidbau/seedrandom
  const phases = [...Array(freqs.length)].map((_, i) => Math.random() * 2 * Math.PI)
  const t = Array.from({ length: trials }, (x, i) => i / trials)
  let probs = Array(trials).fill(0)
  for (let i = 0; i < freqs.length; i++) {
    for (let j = 0; j < t.length; j++) {
      probs[j] += amps[i] * Math.cos(2 * Math.PI * freqs[i] * t[j] + phases[i])
    }
  }
  probs = probs.map((e, i) => e / 2)
  probs = probs.map((e, i) => e + 0.5)
  // to get outcome, generate Math.random() < probs
  return probs
}
