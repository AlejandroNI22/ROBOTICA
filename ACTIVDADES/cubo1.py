import sympy as sp
from spatialmath import *
from spatialmath.base import *
import matplotlib.pyplot as plt
import numpy as np
import roboticstoolbox as rtb
from roboticstoolbox.backends.PyPlot import PyPlot
# Configurar NumPy para suprimir la notación científica y limitar la precisión
np.set_printoptions(suppress=True, precision=4,
                    formatter={'float': lambda x: f"{0:8.4g}" if abs(x) < 1e-10 else f"{x:8.4g}"})


# Definimos el modelo DH para el LR Mate 200iD
cubo1 = rtb.DHRobot([
 rtb.RevoluteDH(d=0.290, a=0, alpha=np.pi/2, qlim=[-2.88, 2.88]),
rtb.RevoluteDH(d=0, a=0.27, alpha=0, offset=np.pi/2, qlim=[-1.92, 1.92]), 
rtb.RevoluteDH(d=0, a=0.07, alpha=np.pi/2, qlim=[-1.92, 1.22]),
rtb.RevoluteDH(d=0.302, a=0, alpha=-np.pi/2, qlim=[-2.79, 2.79]),
rtb.RevoluteDH(d=0, a=0, alpha=np.pi/2, qlim=[-2.09, 2.09]),
rtb.RevoluteDH(d=0.072, a=0, alpha=0, qlim=[-6.98, 6.98])
], name="ABB-IRB-120-3-0-6", base=SE3(0,0,0))

# Ponemos el TCP alineado con el brazo
cubo1.tool = SE3.OA([0, 1, 0], [0, 0, 1])
cubo1.configurations_str('ru')  # Right, elbow Up
cubo1.qz = [np.deg2rad(0.0), np.deg2rad(0.0), np.deg2rad(0.0), np.deg2rad(0.0), np.deg2rad(0.0), np.deg2rad(0.0)]  # Valores el cero
cubo1.qhome = [np.deg2rad(0.0), np.deg2rad(45.0), np.deg2rad(90.0), np.deg2rad(0.0), np.deg2rad(45.0), np.deg2rad(0.0)]  # Valores el cero

# Verificar que quedo igual el DH
print(cubo1)
cubo1.plot(q=cubo1.qz, eeframe=True, jointaxes=False, shadow=True, backend='pyplot', block=True)
cubo1.teach(q=cubo1.qhome)

Tprueba=SE3(0.2, 0.1, 1.23) * SE3.RPY(0, 0, -46, unit='deg')
qprueba=cubo1.ikine_LM(Tprueba, q0=cubo1.qz, tol=1e-4, ilimit=2000, slimit=1000)
cubo1.teach(q=qprueba.q)

x_c = -0.6
y_c = 0.6
z_c = 1.3
# Tamaño del cubo
vertice = 1.20

#Puntos en el espacio, X, Y, Z
T = np.array([
   SE3(x_c, y_c-vertice, z_c-vertice) * SE3.RPY(180, 36, -81, unit='deg'),  # A
    SE3(x_c, y_c-vertice, z_c) * SE3.RPY(0, 0, -46, unit='deg'),            # B
    SE3(x_c, y_c, z_c) * SE3.RPY(0, 0, -46, unit='deg'),                    # C (pivote)
    SE3(x_c, y_c, z_c-vertice) * SE3.RPY(180, 36, -81, unit='deg'),        # D
    SE3(x_c, y_c-vertice, z_c-vertice) * SE3.RPY(180, 36, -81, unit='deg'),  # A
    SE3(x_c+vertice, y_c-vertice, z_c-vertice) * SE3.RPY(180, 36, -81, unit='deg'),  # H
    SE3(x_c+vertice, y_c-vertice, z_c) * SE3.RPY(0, 0, -46, unit='deg'),    # G
    SE3(x_c+vertice, y_c, z_c) * SE3.RPY(0, 0, -46, unit='deg'),           # F
    SE3(x_c+vertice, y_c, z_c-vertice) * SE3.RPY(180, 36, -81, unit='deg'),  # E
    SE3(x_c+vertice, y_c-vertice, z_c-vertice) * SE3.RPY(180, 36, -81, unit='deg'),  # H
    SE3(x_c+vertice, y_c-vertice, z_c) * SE3.RPY(0, 0, -46, unit='deg'),    # G
    SE3(x_c, y_c-vertice, z_c) * SE3.RPY(0, 0, -46, unit='deg'),           # B
    SE3(x_c, y_c, z_c) * SE3.RPY(0, 0, -46, unit='deg'),                    # C
    SE3(x_c+vertice, y_c, z_c) * SE3.RPY(0, 0, -46, unit='deg'),           # F
    SE3(x_c+vertice, y_c, z_c-vertice) * SE3.RPY(180, 36, -81, unit='deg'),  # E
    SE3(x_c, y_c, z_c-vertice) * SE3.RPY(180, 36, -81, unit='deg')         # D
])

via = np.empty((0, 3))
for punto in T:
    xyz = np.array(punto)
    # print(xyz)
    via = np.vstack((via, xyz))  # Append filas a puntos en via

xyz_traj = rtb.mstraj(via, qdmax=[0.5, 0.5, 0.5], dt=0.02, tacc=0.2).q

#Grafico de la trayectoria 
fig = plt.figure()
ax = fig.add_subplot(111, projection="3d")
plt.plot(xyz_traj[:,0], xyz_traj[:,1], xyz_traj[:,2])
ax.scatter(xyz_traj[0, 0], xyz_traj[0, 1], xyz_traj[0, 2], color='red', marker='*') #Inicio
ax.scatter(xyz_traj[-1, 0], xyz_traj[-1, 1], xyz_traj[-1, 2], color='blue', marker='o') #Fin
plt.show()

T_tool = SE3.Trans(-0.15, 0, 0.0) * SE3.Trans(xyz_traj) * SE3.OA([0, -1, 0], [1, 0, 0])
sol = cubo1.ikine_LM(T_tool, "lu")
print(sol.success)
cubo1.plot(q=sol.q, limits=[-0.3,0.6,-0.6,0.6,-0.1,1], eeframe=True, backend='pyplot', shadow=True, jointaxes=True, block=True)

#Guardar imagen
#cubo1.plot(q=sol.q, limits=[-0.3,0.6,-0.6,0.6,-0.1,1], eeframe=True,  backend='pyplot', shadow=True, jointaxes=True, block=True, movie='TransCubo.gif')
