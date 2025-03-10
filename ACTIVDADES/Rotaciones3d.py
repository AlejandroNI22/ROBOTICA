import numpy as np
import matplotlib.pyplot as plt
from spatialmath import *
from spatialmath.base import *
from math import pi
np.set_printoptions(
    formatter={'float': lambda x: f"{0:8.4g}" if abs(x) < 1e-10 else f"{x:8.4g}"})

Rx = rotx(90, unit="deg")
print(Rx)
print('\n')

Ry = roty(90, unit="deg")
print(Ry)
print('\n')

Rz = rotz(90, unit="deg")
print(Rz)
print('\n')

trplot(Rx)
tranimate(Rx)
plt.show()