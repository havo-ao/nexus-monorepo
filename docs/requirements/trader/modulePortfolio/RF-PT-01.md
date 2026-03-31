# Requisitos Funcionales – Portafolio del Trader  
## Sistema: Nexus

---

## Descripción del Módulo

Este módulo permite al trader visualizar todas las acciones adquiridas dentro de la plataforma, analizar su rendimiento y acceder a la opción de venta de cada posición.

---

## RF-PT-01 – Visualizar portafolio de acciones

### Descripción  
El sistema debe permitir al trader visualizar el listado de todas las acciones que posee.

### Actor(es)  
- Trader  

### Precondiciones  
- Usuario autenticado  
- El usuario posee acciones en su cuenta  

### Flujo básico  
1. El sistema consulta las posiciones del trader  
2. El sistema muestra para cada acción:
   - símbolo  
   - cantidad de acciones  
   - precio promedio de compra  
   - precio actual  
   - valor total invertido  
   - valor actual de la posición  

### Flujos alternos  

**1A – Portafolio vacío**

- El sistema informa al usuario que no posee acciones  

### Postcondiciones  
- El usuario visualiza su portafolio actual  