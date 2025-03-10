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

# Declaramos nuestro robot, incluidos limites de movimiento
robot=rtb.DHRobot(
    [
   rtb.RevoluteDH(d=134, a=0, alpha=np.pi/2, qlim=[-2*np.pi, 2*np.pi]), 
rtb.RevoluteDH(d=128.8, a=274, alpha=np.pi, offset=np.pi/2, qlim=[-2*np.pi, 2*np.pi]), 
rtb.RevoluteDH(d=116, a=230, alpha=-np.pi, qlim=[-0.8611*np.pi, 0.8611*np.pi]), 
rtb.RevoluteDH(d=116, a=0, alpha=-np.pi/2, offset=-np.pi/2, qlim=[-2*np.pi, 2*np.pi]), 
rtb.RevoluteDH(d=116, a=0, alpha=np.pi/2, qlim=[-2*np.pi, 2*np.pi]), 
rtb.RevoluteDH(d=105, a=0, alpha=0, qlim=[-2*np.pi, 2*np.pi]),
    ], name="Cobot CR3", base=SE3(0,0,0))

# Ponemos el TCP alineado con el brazo
robot.tool = SE3.OA([0, 1, 0], [0, 0, 1])
robot.configurations_str('ru')  # Right, elbow Up
robot.qz = [np.deg2rad(0.0), np.deg2rad(0.0), np.deg2rad(0.0), np.deg2rad(0.0), np.deg2rad(0.0), np.deg2rad(0.0)]  # Valores el cero
robot.qhome=[np.deg2rad(0.0), np.deg2rad(90.0), np.deg2rad(90.0), np.deg2rad(0.0), np.deg2rad(90.0), np.deg2rad(0.0)]  # Valores el cero

# Verificar que quedo igual el DH
print(robot)
robot.plot(q=robot.qz, eeframe=True, jointaxes=False, shadow=True ,backend='pyplot', block=True)
robot.teach(q=robot.qhome)

Tprueba=SE3(0.2, 0.1, 1.23) * SE3.RPY(0, 0, -46, unit='deg')
qprueba=robot.ikine_LM(Tprueba, q0=robot.qz, tol=1e-4, ilimit=2000, slimit=1000)
robot.teach(q=qprueba.q)

#Cambiamos la pose
#T_cubo = [
#     SE3(0.2, -0.3, 0.) * SE3.RPY(180, 36, -81, unit='deg'),  # A
#     SE3(0.2, -0.3, 1) * SE3.RPY(180, 0, -81, unit='deg'),   # B
#     SE3(0.2, 0.1, 1) * SE3.RPY(180, 0, -81, unit='deg'),    # C
#     SE3(0.2, 0.1, 0.3) * SE3.RPY(180, 36, -81, unit='deg'),   # D
#     SE3(0.2, -0.3, 0.3) * SE3.RPY(180, 36, -81, unit='deg'),  # A
#     SE3(0.4, -0.3, 0.3) * SE3.RPY(180, 36, -81, unit='deg'),  # H
#     SE3(0.4, -0.3, 1) * SE3.RPY(180, 0, -81, unit='deg'),   # G
#     SE3(0.4, 0.1, 1) * SE3.RPY(180, 0, -81, unit='deg'),    # F
#     SE3(0.4, 0.1, 0.3) * SE3.RPY(180, 36, -81, unit='deg'),   # E
#     SE3(0.4, -0.3, 0.5) * SE3.RPY(180, 36, -81, unit='deg'),  # H
#     SE3(0.4, -0.3, 1) * SE3.RPY(180, 0, -81, unit='deg'),   # G
#     SE3(0.2, -0.3, 1) * SE3.RPY(180, 0, -81, unit='deg'),   # B
#     SE3(0.2, 0.1, 1) * SE3.RPY(180, 0, -81, unit='deg'),    # C
#     SE3(0.4, 0.1, 1) * SE3.RPY(180, 0, -81, unit='deg'),    # F
#     SE3(0.4, 0.1, 0.3) * SE3.RPY(180, 36, -81, unit='deg'),   # E
#     SE3(0.2, 0.1, 0.3) * SE3.RPY(180, 36, -81, unit='deg') ,   # D
# ]

# Punto pivote C
x_c = 200
y_c = 300
z_c = 200
# Tamaño del cubo
vertice = 150
T_cubo = [
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
]

# Imprimir las coordenadas de los puntos A-H
puntos = ['A', 'B', 'C', 'D', 'A', 'H', 'G', 'F', 'E', 'H', 'G', 'B', 'C', 'F', 'E', 'D']
print("Coordenadas de los puntos A-H:")
print("Punto\tX\t\tY\t\tZ")
for i, T in enumerate(T_cubo[:16]):
    print(f"{puntos[i]}\t{T.t[0]:.4f}\t{T.t[1]:.4f}\t{T.t[2]:.4f}")


# Generar la trayectoria cartesiana
print("Generando trayectoria cartesiana...")
traj = []
for i in range(len(T_cubo) - 1):
    segment = rtb.ctraj(T_cubo[i], T_cubo[i + 1], 10)  # 10 pasos entre cada par de poses
    traj.extend(segment)  # Une todos los segmentos en una sola trayectoria

# Resolver cinemática inversa para cada pose de la trayectoria
print("Resolviendo cinemática inversa...")
qtraj = []
total_poses = len(traj)
q0 = robot.qz  # Configuración inicial para la primera pose

for i, pose in enumerate(traj):
    # Mostrar progreso en la misma línea
    animation = "|/-\\"
    print(f"\rProgreso: {i+1}/{total_poses} ({(i+1)/total_poses*100:.1f}%) {animation[i%4]}", end="")

    sol = robot.ikine_LM(
        pose,
        q0=q0,  # Usar la configuración inicial actualizada
        tol=1e-5,
        ilimit=500,
        slimit=25,
    )

    if sol.success:
        qtraj.append(sol.q)
        q0 = sol.q  # Actualizar q0 para la siguiente iteración
        # Imprimir las coordenadas alcanzadas
        print(f"\nCoordenadas alcanzadas en paso {i+1}: {pose.t}")
        # Convertir ángulos de las articulaciones a grados e imprimir
        q_degrees = np.rad2deg(sol.q)
        print(f"Ángulos de las articulaciones en grados en paso {i+1}: {q_degrees}")
    else:
        print(f"\nError: Pose no alcanzable en paso {i+1}: {pose.t}")
        raise ValueError(f"No se pudo alcanzar la pose {i+1}. Cancelando ejecución.")

# Verificar que se hayan encontrado configuraciones válidas
if not qtraj:
    raise ValueError("Ninguna configuración válida encontrada")

qtraj = np.array(qtraj)

#Superfuncion que plotea robot y dibuja trayectoriadef plot_robot_trajectory(robot, q_trajectory, drawing_mode='continuous',
def plot_robot_trajectory(robot, q_trajectory, limits=None, eeframe=True, jointaxes=False,
                         shadow=False, drawing_mode='continuous', traj_color='b',
                         drawing_color='r', drawing_threshold=0.01, dt=0.05, block=True):
    """
    Visualiza un robot siguiendo una trayectoria con trazado de la ruta del efector final.

    Parámetros:
    -----------
    robot : DHRobot
        El robot a visualizar
    q_trajectory : ndarray
        Matriz de configuraciones articulares (n_puntos x n_articulaciones)
    limits : list, opcional
        Límites de visualización [xmin, xmax, ymin, ymax, zmin, zmax]
    eeframe : bool, opcional
        Si se debe mostrar el marco del efector final
    jointaxes : bool, opcional
        Si se deben mostrar los ejes de las articulaciones
    shadow : bool, opcional
        Si se debe mostrar la sombra del robot
    drawing_mode : str, opcional
        Modo de dibujo: 'continuous' o 'segments'
    traj_color : str, opcional
        Color de la trayectoria completa
    drawing_color : str, opcional
        Color de los trazos de dibujo
    drawing_threshold : float, opcional
        Umbral de velocidad para el modo 'segments'
    dt : float, opcional
        Tiempo entre actualizaciones de la visualización
    block : bool, opcional
        Si se debe bloquear la ejecución hasta cerrar la ventana

    Retorna:
    --------
    env : PyPlot
        El entorno de visualización
    """
    from roboticstoolbox.backends.PyPlot import PyPlot
    import numpy as np

    # Inicializar el entorno PyPlot
    env = PyPlot()
    env.launch()

    # Calcular posiciones del efector final para toda la trayectoria
    all_positions = []
    for q in q_trajectory:
        T = robot.fkine(q)
        all_positions.append(T.t)

    all_positions = np.array(all_positions)

    # Calcular velocidades para el modo 'segments'
    if drawing_mode == 'segments':
        velocities = np.zeros(len(all_positions))
        for i in range(1, len(all_positions)):
            velocities[i] = np.linalg.norm(all_positions[i] - all_positions[i-1]) / dt

    # Configurar los límites de visualización
    if limits:
        env.ax.set_xlim([limits[0], limits[1]])
        env.ax.set_ylim([limits[2], limits[3]])
        env.ax.set_zlim([limits[4], limits[5]])
    else:
        # Configurar automáticamente
        min_pos = np.min(all_positions, axis=0) - 0.5
        max_pos = np.max(all_positions, axis=0) + 0.5
        env.ax.set_xlim([min_pos[0], max_pos[0]])
        env.ax.set_ylim([min_pos[1], max_pos[1]])
        env.ax.set_zlim([min_pos[2], max_pos[2]])

    # Añadir el robot al entorno con las opciones especificadas
    env.add(robot, eeframe=eeframe, jointaxes=jointaxes, shadow=shadow)

    # Lista para almacenar los puntos de la trayectoria
    traj_points = []

    # Variables para el seguimiento de los trazos de dibujo
    drawing_points = []
    is_drawing = False

    # Objeto de línea para la trayectoria
    line_obj = None

    # Recorrer la trayectoria y actualizar la visualización
    for i in range(len(q_trajectory)):
        # Actualizar la configuración del robot
        robot.q = q_trajectory[i]

        # Obtener la posición actual del efector final
        T_current = robot.fkine(robot.q)
        current_pos = T_current.t
        traj_points.append(current_pos)

        # Determinar si está dibujando según el modo
        if drawing_mode == 'continuous':
            # En modo continuo, siempre está dibujando
            is_drawing = True
            drawing_points.append(current_pos)

        elif drawing_mode == 'segments':
            # En modo segmentos, dibuja cuando la velocidad es baja
            current_drawing = velocities[i] < drawing_threshold

            # Si cambia el estado de dibujo
            if current_drawing != is_drawing:
                is_drawing = current_drawing
                if is_drawing:
                    drawing_points = [current_pos]
                else:
                    # Dibujar el segmento completado
                    if len(drawing_points) > 1:
                        points_array = np.array(drawing_points)
                        env.ax.plot(points_array[:, 0], points_array[:, 1], points_array[:, 2],
                                   f'{drawing_color}-', linewidth=2)

            # Añadir el punto actual si está dibujando
            if is_drawing:
                drawing_points.append(current_pos)

        # Dibujar la trayectoria completa hasta el momento
        if len(traj_points) > 1:
            points_array = np.array(traj_points)

            # Si ya existe una línea, eliminarla
            if line_obj:
                line_obj[0].remove()

            # Crear una nueva línea con todos los puntos acumulados
            line_obj = env.ax.plot(points_array[:, 0], points_array[:, 1], points_array[:, 2],
                                  f'{traj_color}-', linewidth=1, alpha=0.5)

        # Actualizar la visualización
        env.step(dt)

    # Dibujar el último segmento si está en modo segmentos
    if drawing_mode == 'segments' and is_drawing and len(drawing_points) > 1:
        points_array = np.array(drawing_points)
        env.ax.plot(points_array[:, 0], points_array[:, 1], points_array[:, 2],
                   f'{drawing_color}-', linewidth=2)

    # Si está en modo continuo, dibujar toda la trayectoria con el color de dibujo
    if drawing_mode == 'continuous' and len(drawing_points) > 1:
        points_array = np.array(drawing_points)
        env.ax.plot(points_array[:, 0], points_array[:, 1], points_array[:, 2],
                   f'{drawing_color}-', linewidth=2)

    print("Trayectoria completada")

    # Mantener la visualización si block=True
    if block:
        env.hold()

    return env

#Antes
#p_lim=[-1, 1, -1, 1, -0.15, 1.5]
#robot.plot(q=qtraj, limits=p_lim, eeframe=True, jointaxes=False, shadow=True ,backend='pyplot', block=True, dt=0.15)
#Ahora
p_lim=[-500, 500, -500, 500, -500, 500]
plot_robot_trajectory(
    robot=robot,
    q_trajectory=qtraj,
    limits=p_lim,
    eeframe=True,
    jointaxes=False,
    shadow=True,
    drawing_mode='continuous',  # o 'segments' si prefieres
    traj_color='r',             # Color de la trayectoria completa
    drawing_color='b',          # Color del trazo principal
    dt=0.15,
    block=True
)