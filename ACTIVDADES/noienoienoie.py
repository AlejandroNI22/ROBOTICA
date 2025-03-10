import sympy as sp 

from sympy.matrices import rot_axis3 

# Para el ejemplo donde generamos la matriz DH 

from spatialmath import * 

from spatialmath.base import * 

# Para poder Graficar 

import matplotlib.pyplot as plt 

import numpy as np 

# Para usar el DH 

import roboticstoolbox as rtb 

theta, d, a, alpha = sp.symbols('theta d a alpha') 

# T = RzTzTxRx Matrix base DH 

T = sp.Matrix([ 

[sp.cos(theta), -sp.sin(theta)*sp.cos(alpha), sp.sin(theta)*sp.sin(alpha), a*sp.cos(theta)], 

[sp.sin(theta), sp.cos(theta)*sp.cos(alpha), -sp.cos(theta)*sp.sin(alpha), a*sp.sin(theta)], 

[0, sp.sin(alpha), sp.cos(alpha), d], 

[0, 0, 0, 1] 

]) 

# Definimos los angulos y distancias para que cada uno sea único 

theta1, theta2, theta3, theta4, theta5, theta6 = sp.symbols('theta1 theta2 theta3 theta4 theta5 theta6') 

# De la tabla 

T01 = T.subs({d: 0.330, a: 0, alpha: sp.pi/2, theta: theta1}) 

sp.pprint(T01) 

T12 = T.subs({d: 0, a: 0.26, alpha: 0, theta: theta2}) 

sp.pprint(T12) 

T23 = T.subs({d: 0, a: 0.02, alpha: sp.pi/2, theta: theta3}) 

sp.pprint(T23) 

T34 = T.subs({d: 0.290, a: 0, alpha: -sp.pi/2, theta: theta4}) 

sp.pprint(T34) 

T45 = T.subs({d: 0, a: 0, alpha: sp.pi/2, theta: theta5}) 

sp.pprint(T45) 

T56 = T.subs({d: 0.07, a: 0, alpha: 0, theta: theta6}) 

sp.pprint(T56) 

T06 = T01 @ T12 @ T23 @ T34 @ T45 @ T56 

T06_s = T06.applyfunc(sp.simplify) 

sp.pprint(T06_s) 

# Para modificar los angulos comodamente 

joint1 = np.deg2rad(0) 

joint2 = np.deg2rad(0) + sp.pi/2 # offset 

joint3 = np.deg2rad(0) 

joint4 = np.deg2rad(0) 

joint5 = np.deg2rad(0) 

joint6 = np.deg2rad(0) 

# Matriz de transformación del efector final 

T06_solved = T06_s.subs([(theta1, joint1), (theta2, joint2), (theta3, joint3), (theta4, joint4), (theta5, joint5), (theta6, joint6)]) 

sp.pprint(T06_solved) 

# Definimos el modelo DH para el ABB-IRB-120-3-0-6 

IRB_robot = rtb.DHRobot( 

[ 
rtb.RevoluteDH(d=0.330, a=0, alpha=np.pi/2, qlim=[-5.93, 5.93]), 
rtb.RevoluteDH(d=0, a=0.26, alpha=0, offset=np.pi/2, qlim=[-4.01, 4.01]), 
rtb.RevoluteDH(d=0, a=0.02, alpha=np.pi/2, qlim=[-7.02, 7.02]), 
rtb.RevoluteDH(d=0.290, a=0, alpha=-np.pi/2, qlim=[-6.63, 6.63]), 
rtb.RevoluteDH(d=0, a=0, alpha=np.pi/2, qlim=[-4.19, 4.19]), 
rtb.RevoluteDH(d=0.070, a=0, alpha=0, qlim=[-12.57, 12.57]) 
], name="ABB-IRB-120-3-0-6", base=SE3(0, 0, 0) 

) 

print(IRB_robot) 

T06DH_all = IRB_robot.fkine_all([joint1, joint2, joint3, joint4, joint5, joint6]) 

print(T06DH_all[1]) # T01 

print(T06DH_all[2]) # T12 

print(T06DH_all[3]) # T23 

print(T06DH_all[4]) # T34 

print(T06DH_all[5]) # T45 

print(T06DH_all[6]) # T56 

# Definir variables articulares para la animación 

#q = np.array([[joint1, joint2, joint3, joint4, joint5, joint6]]) 

# Graficar con posiciones q, una cada 3 seg 

#IRB_robot.plot(q=q, block=True, dt=3, limits=[-0.8, 0.8, -0.8, 0.8, -0.4, 0.6], shadow=True, jointaxes=True) 

# Graficar con controlador 

q1 = np.array([[0, np.pi/2, 0, 0, 0, 0]]) 

IRB_robot.teach(q1) 