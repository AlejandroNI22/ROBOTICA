import sympy as sp
from sympy.matrices import rot_axis3
# Para el ejemplo donde generamos la matriz DH
from spatialmath import *
from spatialmath.base import *
# Para poder Graficar
import matplotlib.pyplot as plt
import numpy as np
#Para usar el DH
import roboticstoolbox as rtb

# Definimos el modelo DH para el LR Mate 200iD
lrmate = rtb.DHRobot([
    rtb.RevoluteDH(d=0.330, a=0, alpha=np.pi/2, qlim=[-5.93, 5.93]),
    rtb.RevoluteDH(d=0, a=0.260, alpha=0, offset=np.pi/2, qlim=[-1.75, 2.79]),
    rtb.RevoluteDH(d=0, a=0.020, alpha=np.pi/2, qlim=[-2.44, 2.44]),
    rtb.RevoluteDH(d=0.29, a=0, alpha=-np.pi/2, qlim=[-3.14, 3.14]),
    rtb.RevoluteDH(d=0, a=0, alpha=np.pi/2, qlim=[-2.09, 2.09]),
    rtb.RevoluteDH(d=0.070, a=0, alpha=0, qlim=[-6.28, 6.28])
], name="LR Mate 200iD", base=SE3(0,0,0))

print(lrmate)

# Definimos posiciones articulares
joint1 = np.deg2rad(30)
joint2 = np.deg2rad(-45)
joint3 = np.deg2rad(60)
joint4 = np.deg2rad(-30)
joint5 = np.deg2rad(45)
joint6 = np.deg2rad(90)

# Matriz de transformación del efector final
T06DH = lrmate.fkine([joint1, joint2, joint3, joint4, joint5, joint6])
print(T06DH)

T06DH_all = lrmate.fkine_all([joint1, joint2, joint3, joint4, joint5, joint6])
print(T06DH_all[1]) # T01
print(T06DH_all[2]) # T12
print(T06DH_all[3]) # T23
print(T06DH_all[4]) # T34
print(T06DH_all[5]) # T45
print(T06DH_all[6]) # T56

# Definir variables articulares para la animación
q = np.array([
    [0, 0, 0, 0, 0, 0],
    [joint1, 0, 0, 0, 0, 0],
    [joint1, joint2, 0, 0, 0, 0],
    [joint1, joint2, joint3, 0, 0, 0],
    [joint1, joint2, joint3, joint4, 0, 0],
    [joint1, joint2, joint3, joint4, joint5, 0],
    [joint1, joint2, joint3, joint4, joint5, joint6],
    [joint1, joint2, joint3, joint4, joint5, 0],
    [joint1, joint2, joint3, joint4, 0, 0],
    [joint1, joint2, joint3, 0, 0, 0],
    [joint1, joint2, 0, 0, 0, 0],
    [joint1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0]
])

# Graficar con posiciones q, una cada 3 segundos
#lrmate.plot(q=q, backend='pyplot', dt=3, limits=[-1,1,-1,1,0,1], shadow=True, jointaxes=True)

# Graficar y salvar video
#lrmate.plot(q=q, backend='pyplot', dt=3, limits=[-1,1,-1,1,0,1], shadow=True, loop=False, jointaxes=True, movie="lrmate_robot.gif")

# Graficar con controlador
q1 = np.array([[0, 0, 0, 0, 0, 0]])
lrmate.teach(q1)
