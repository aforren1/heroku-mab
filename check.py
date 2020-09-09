import numpy as np
from numpy.random import default_rng
import matplotlib.pyplot as plt
from scipy.fft import fft
import json

with open('data_5f060d4118d7fd11fd182dee.json', 'r') as f:
    data = json.load(f)

plt.plot(data['probs'])

plt.show()

n = 200
t = 1 / 200
x = np.arange(0, 1, 1/n)
y = np.array(data['probs']) - np.mean(data['probs'])
yf = fft(y)
xf = np.arange(0, n//2, 1)
# xf = np.linspace(0, 1.0 / (2.0 * t), n // 2)
plt.plot(xf, 2.0 / n * np.abs(yf[:n // 2]))
plt.grid()
plt.title('FFT of <-')
plt.show()