import math

r = float(input("Introduce el radio: "))
perimetro = 2 * math.pi * r
area = math.pi * r ** 2

print(f"Perímetro: {perimetro:.2f}, Área: {area:.2f}")

volumen = (4/3) * math.pi * r ** 3

print(f"Volumen: {volumen:.2f}")