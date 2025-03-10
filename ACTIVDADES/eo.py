import roboticstoolbox as rtb
import spatialmath.base as smb
import spatialmath as sm
import numpy as np
np.set_printoptions(suppress=True, precision=4)

# Crear instancia del Puma560
p560 = rtb.models.DH.Puma560()

# Graficar el robot en su posición inicial (qz)
p560.plot(p560.qz, block=False)

# Definir una matriz homogenea (una traslación y una rotación)
T = sm.SE3.Trans(0.4, 0.1, 0) * sm.SE3(smb.rpy2tr(0, 180, 0, 'deg'))
print(T, "\n")

# Graficar la matriz (sobre el robot)
smb.trplot(T.A, block=True)

#Calcular la cinemática inversa para la matriz de transformación T
q = p560.ikine_a(T) #Default: izquierda codo arriba
print(f"Izq, codo arriba\n {q.q}")
#En grados
print(f"Izq, codo arriba grados:\n {np.rad2deg(q.q)}")
#Mostrar robot en posicion calculada
p560.plot(q.q, block=True)

# #Calcular inversa con configuración derecha, codo arriba
q = p560.ikine_a(T, config = 'ru')
print(f"Der, codo arriba\n {q.q}")
#En grados
print(f"Der, codo arriba grados:\n {np.rad2deg(q.q)}")
p560.plot(q.q, block=True)

#Calcular inversa con configuración derecha, codo abajo
q = p560.ikine_a(T, config = 'rd')
print(f"Der, codo abajo {q.q}")
#En grados
print(f"Der, codo abajo grados:\n {np.rad2deg(q.q)}")
p560.plot(q.q, block=True)

#Calcular inversa con configuración izquierda, codo abajo
q = p560.ikine_a(T, config = 'ld')
print(f"Izq, codo abajo{q.q}")
#En grados
print(f"Izq, codo abajo grados:\n {np.rad2deg(q.q)}")
p560.plot(q.q, block=True)

# Definimos el modelo DH para el LR Mate 200iD
robot = rtb.DHRobot([
    rtb.RevoluteDH(d=0.4, a=180, alpha=np.pi/2, qlim=[np.deg2grad(-155), np.deg2rad(155)]),
    rtb.RevoluteDH(d=0, a=0.6, alpha=0, offset=np.pi/2, qlim=[np.deg2rad(-180), np.deg2rad(65)]),            
    rtb.RevoluteDH(d=0, a=0.120, alpha=np.pi/2, offset=np.pi/2, qlim=[np.deg2grad(-110), np.deg2rad(170)]),
    rtb.RevoluteDH(d=0.62, a=0, alpha=np.pi/2, qlim=[np.deg2grad(-165), np.deg2rad(165)]),
    rtb.RevoluteDH(d=0.0, a=0, alpha=-np.pi/2, qlim=[np.deg2grad(-140), np.deg2rad(140)]),
    rtb.RevoluteDH(d=0.115, a=0, alpha=0, qlim=[np.deg2grad(-360), np.deg2rad(360)]),
], name="KUKA", base=SE3(0,0,0))

print(robot)
